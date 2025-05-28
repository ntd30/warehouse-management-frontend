import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Space, Tooltip, Spin, Select, Button, DatePicker } from 'antd';
import {
    BoxPlotOutlined,
    DropboxOutlined,
    LoginOutlined,
    LogoutOutlined,
    CarryOutOutlined,
    LineChartOutlined,
    SettingOutlined,
    CalendarOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend,
    Filler,
} from 'chart.js';
import {
    countProductsAPI,
    countStockAPI,
    countTotalImportQuantityAPI,
    countTotalExportQuantityAPI,
    fetchWarehouseReportAPI,
    fetchProductReportAPI,
} from '../services/api.service';
import axios from '../services/axios.customize';
import moment from 'moment';
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, ChartTitle, ChartTooltip, Legend, Filler);

const { Title, Text } = Typography;

const DashboardPage = () => {
    const [inventoryData, setInventoryData] = useState({
        totalProducts: 0,
        totalStock: 0,
        stockInThisMonth: 0,
        stockOutThisMonth: 0,
        lastStockCheck: 'N/A',
    });
    const [chartData, setChartData] = useState([]);
    const [stockInOutData, setStockInOutData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('month');
    const [selectedDate, setSelectedDate] = useState(null);
    const currentMonthYear = new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    useEffect(() => {
        const fetchData = async () => {
            console.log('[DashboardPage] Starting fetchData with timeRange:', timeRange, 'selectedDate:', selectedDate);
            setLoading(true);
            console.log('[DashboardPage] Set loading to true');

            try {
                const productsCount = await countProductsAPI();
                const stockCount = await countStockAPI();
                const importCount = await countTotalImportQuantityAPI();
                const exportCount = await countTotalExportQuantityAPI();

                let startDate, endDate;
                const today = new Date();
                endDate = moment(today).endOf('day').toISOString(); // Set endDate to end of today

                if (timeRange === 'custom' && selectedDate) {
                    if (selectedDate.isWeek) {
                        startDate = moment(selectedDate.date).startOf('week').toISOString();
                        endDate = moment(selectedDate.date).endOf('week').toISOString();
                    } else {
                        startDate = moment(selectedDate.date).startOf('day').toISOString();
                        endDate = moment(selectedDate.date).endOf('day').toISOString();
                    }
                } else {
                    if (timeRange === 'month') {
                        startDate = moment(today).startOf('month').toISOString();
                    } else if (timeRange === 'week') {
                        startDate = moment(today).startOf('week').toISOString();
                    } else { // day
                        startDate = moment(today).startOf('day').toISOString();
                    }
                }
                console.log('[DashboardPage] Calculated date range:', { startDate, endDate });

                const warehouseResponse = await fetchWarehouseReportAPI(startDate, endDate, timeRange);
                console.log('[DashboardPage] Response from /api/reports/warehouse:', warehouseResponse.data);
                const warehouseData = Array.isArray(warehouseResponse.data.content) ? warehouseResponse.data.content : [];
                console.log('[DashboardPage] Warehouse data content length:', warehouseData.length);

                const totalStock = warehouseData.reduce((sum, item) => sum + (item.closingStock || 0), 0);
                const stockInThisMonth = warehouseData.reduce((sum, item) => sum + (item.totalIn || 0), 0);
                const stockOutThisMonth = warehouseData.reduce((sum, item) => sum + (item.totalOut || 0), 0);
                const lastStockCheck = warehouseData.length > 0 ? moment(warehouseData[warehouseData.length - 1].date).format('YYYY-MM-DD') : 'N/A';
                console.log('[DashboardPage] Processed warehouse data:', {
                    totalStock,
                    stockInThisMonth,
                    stockOutThisMonth,
                    lastStockCheck,
                    rawData: warehouseData,
                });

                const newInventoryData = {
                    totalProducts: productsCount.data || 0,
                    totalStock: stockCount.data || totalStock,
                    stockInThisMonth: importCount.data || stockInThisMonth,
                    stockOutThisMonth: exportCount.data || stockOutThisMonth,
                    lastStockCheck,
                };
                setInventoryData(newInventoryData);
                console.log('[DashboardPage] Updated inventoryData:', newInventoryData);

                const productResponse = await fetchProductReportAPI(timeRange);
                console.log('[DashboardPage] Response from /api/reports/products:', productResponse.data);
                const productData = productResponse.data.content || [];
                console.log('[DashboardPage] Product report content length:', productData.length);
                console.log('[DashboardPage] Product report content sample:', productData.slice(0, 5));

                // Process chartData from productData or warehouseData
                let newChartData = productData.map(item => ({
                    day: moment(item.day || item.date).format('YYYY-MM-DD'),
                    value: item.value || item.closingStock || item.stock || 0,
                })).filter(item => item.day && item.value !== undefined);

                if (newChartData.length === 0 && warehouseData.length > 0) {
                    console.log('[DashboardPage] Using warehouse data as fallback for chart');
                    newChartData = warehouseData.map(item => ({
                        day: moment(item.date).format('YYYY-MM-DD'),
                        value: item.closingStock || 0,
                    })).filter(item => item.day && item.value !== undefined);
                }
                console.log('[DashboardPage] Processed chartData:', newChartData);
                setChartData(newChartData);

                // Process stockInOutData from warehouseData
                const newStockInOutData = warehouseData.map(item => ({
                    day: moment(item.date).format('YYYY-MM-DD'),
                    stockIn: item.totalIn || 0,
                    stockOut: item.totalOut || 0,
                })).filter(item => item.day && (item.stockIn !== undefined || item.stockOut !== undefined));
                console.log('[DashboardPage] Processed stockInOutData:', newStockInOutData);
                setStockInOutData(newStockInOutData);

                // Process categoryData from productData
                const categoryStock = productData.reduce((acc, item) => {
                    const category = item.category || item.supplierName || 'Unknown';
                    const stock = item.closingStock || item.stock || 0;
                    acc[category] = (acc[category] || 0) + stock;
                    return acc;
                }, {});
                const newCategoryData = Object.entries(categoryStock).map(([category, stock]) => ({
                    category,
                    stock,
                }));
                console.log('[DashboardPage] Processed categoryData:', newCategoryData);
                setCategoryData(newCategoryData.length > 0 ? newCategoryData : [
                    { category: 'Category A', stock: 100 },
                    { category: 'Category B', stock: 200 },
                    { category: 'Category C', stock: 150 },
                ]);

                if (newChartData.length === 0) {
                    console.log('[DashboardPage] No chart data available, checking API response structure');
                }
            } catch (err) {
                console.error('[DashboardPage] Error in fetchData:', err);
                console.error('[DashboardPage] Error details:', {
                    message: err.message,
                    stack: err.stack,
                    response: err.response ? err.response.data : 'No response data',
                });
            } finally {
                setLoading(false);
                console.log('[DashboardPage] Set loading to false');
            }
        };
        fetchData();
    }, [timeRange, selectedDate]);

    const statCards = [
        { title: 'Tổng SP khác nhau', value: inventoryData.totalProducts, icon: <DropboxOutlined />, precision: 0, suffix: 'sản phẩm', tooltip: 'Đếm theo mã sản phẩm' },
        { title: 'Tổng SL tồn kho', value: inventoryData.totalStock, icon: <BoxPlotOutlined />, precision: 0, suffix: 'đơn vị', tooltip: 'Tổng đơn vị hàng hóa' },
        { title: 'SL nhập', value: inventoryData.stockInThisMonth, icon: <LoginOutlined />, precision: 0, suffix: 'đơn vị', tooltip: 'Tính đến hiện tại' },
        { title: 'SL xuất', value: inventoryData.stockOutThisMonth, icon: <LogoutOutlined />, precision: 0, suffix: 'đơn vị', tooltip: 'Tính đến hiện tại' },
        { title: 'Kiểm kho gần nhất', value: inventoryData.lastStockCheck, icon: <CalendarOutlined />, isDate: true, tooltip: 'Ngày hoàn thành kiểm kê' },
    ];

    const taskCards = [
        { title: 'Quản lý Nhập Kho', icon: <LoginOutlined />, description: 'Tạo phiếu nhập, xem lịch sử', link: '/stock-in' },
        { title: 'Quản lý Xuất Kho', icon: <LogoutOutlined />, description: 'Tạo phiếu xuất, xem lịch sử', link: '/stock-out' },
        { title: 'Quản lý Kiểm Kê', icon: <CarryOutOutlined />, description: 'Tạo phiếu, đối chiếu số liệu', link: '/stock-check' },
        { title: 'Quản lý Báo Cáo', icon: <LineChartOutlined />, description: 'Báo cáo tồn kho, NXT', link: '/reports' },
        { title: 'Cài Đặt', icon: <SettingOutlined />, description: 'Sản phẩm, kho, người dùng', link: '/settings' },
    ];

    const chartConfig = {
        data: {
            labels: chartData.map(item => moment(item.day).format('DD/MM')),
            datasets: [{
                label: 'Tồn kho',
                data: chartData.map(item => item.value),
                borderColor: '#1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.2)',
                fill: true,
                tension: 0.4,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { 
                    display: true, 
                    text: `Biến động tồn kho (${timeRange === 'month' ? 'tháng' : timeRange === 'week' ? 'tuần' : timeRange === 'custom' && selectedDate?.isWeek ? 'tuần' : 'ngày'})` 
                },
            },
            scales: {
                x: { title: { display: true, text: 'Ngày' } },
                y: { title: { display: true, text: 'Số lượng' }, beginAtZero: true },
            },
        },
    };

    const barChartConfig = {
        type: 'bar',
        data: {
            labels: ['Tổng SP khác nhau', 'Tổng SL tồn kho', 'SL nhập kho', 'SL xuất kho'],
            datasets: [{
                label: 'Số lượng',
                data: [inventoryData.totalProducts, inventoryData.totalStock, inventoryData.stockInThisMonth, inventoryData.stockOutThisMonth],
                backgroundColor: ['#FF6384', '#36A2EB', '#4CAF50', '#FFCE56'],
                borderColor: ['#FF6384', '#36A2EB', '#4CAF50', '#FFCE56'],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { 
                    display: true, 
                    text: 'Tổng Quan Tình Trạng Kho' 
                },
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Số lượng' } },
                x: { title: { display: true, text: 'Hạng mục' } },
            },
        },
    };

    const pieChartConfig = {
        type: 'pie',
        data: {
            labels: categoryData.map(item => item.category),
            datasets: [{
                label: 'Tồn kho theo danh mục',
                data: categoryData.map(item => item.stock),
                backgroundColor: ['#FF6384', '#36A2EB', '#4CAF50', '#FFCE56', '#E7E9ED', '#9966FF'],
                borderColor: ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff'],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' },
                title: { 
                    display: true, 
                    text: 'Phân Bố Tồn Kho Theo Danh Mục' 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                            let percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        },
                    },
                },
            },
        },
    };

    const stockInOutChartConfig = {
        type: 'line',
        data: {
            labels: stockInOutData.map(item => moment(item.day).format('DD/MM')),
            datasets: [
                {
                    label: 'Nhập kho',
                    data: stockInOutData.map(item => item.stockIn),
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'Xuất kho',
                    data: stockInOutData.map(item => item.stockOut),
                    borderColor: '#FF5733',
                    backgroundColor: 'rgba(255, 87, 51, 0.2)',
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { 
                    display: true, 
                    text: `So Sánh Nhập/Xuất Kho (${timeRange === 'month' ? 'tháng' : timeRange === 'week' ? 'tuần' : timeRange === 'custom' && selectedDate?.isWeek ? 'tuần' : 'ngày'})` 
                },
            },
            scales: {
                x: { title: { display: true, text: 'Ngày' } },
                y: { title: { display: true, text: 'Số lượng' }, beginAtZero: true },
            },
        },
    };

    const handleDateChange = (date) => {
        if (date) {
            setSelectedDate({ date, isWeek: false });
            setTimeRange('custom');
        } else {
            setSelectedDate(null);
            setTimeRange('month');
        }
    };

    const handleWeekChange = (date) => {
        if (date) {
            setSelectedDate({ date, isWeek: true });
            setTimeRange('custom');
        } else {
            setSelectedDate(null);
            setTimeRange('month');
        }
    };

    return (
        <div style={{ background: '#fff', padding: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
            <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
                <Text strong>Lọc theo thời gian:</Text>
                <Select
                    value={timeRange}
                    onChange={(value) => {
                        setTimeRange(value);
                        setSelectedDate(null);
                    }}
                    style={{ width: 120 }}
                    options={[
                        { value: 'day', label: 'Ngày' },
                        { value: 'week', label: 'Tuần' },
                        { value: 'month', label: 'Tháng' },
                        { value: 'custom', label: 'Tùy chỉnh' },
                    ]}
                />
                {timeRange === 'custom' && (
                    <>
                        <DatePicker
                            onChange={handleDateChange}
                            format="DD/MM/YYYY"
                            placeholder="Chọn ngày"
                            style={{ width: 150 }}
                            disabledDate={(current) => current && current > moment().endOf('day')}
                        />
                        <DatePicker.WeekPicker
                            onChange={handleWeekChange}
                            format="DD/MM/YYYY"
                            placeholder="Chọn tuần"
                            style={{ width: 150 }}
                            disabledDate={(current) => current && current > moment().endOf('week')}
                        />
                    </>
                )}
            </Space>

            <Title level={4} style={{ marginBottom: '20px' }}>Tổng Quan Tình Trạng Kho ({currentMonthYear})</Title>
            {loading ? (
                <Spin tip="Đang tải dữ liệu..." style={{ display: 'block', margin: '50px auto' }} />
            ) : (
                <Row gutter={[16, 16]}>
                    {statCards.map((card, index) => (
                        <Col xs={24} sm={12} md={12} lg={8} xl={24 / statCards.length} key={index}>
                            <Tooltip title={card.tooltip}>
                                <Card hoverable bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                    {card.isDate ? (
                                        <Statistic title={<Space>{card.icon}{card.title}</Space>} value={card.value} />
                                    ) : (
                                        <Statistic
                                            title={<Space>{card.icon}{card.title}</Space>}
                                            value={card.value}
                                            precision={card.precision}
                                            valueStyle={{ color: card.value > 0 && (card.title.includes('nhập') || card.title.includes('tồn')) ? '#3f8600' : (card.title.includes('xuất') ? '#cf1322' : undefined) }}
                                            suffix={card.suffix}
                                        />
                                    )}
                                </Card>
                            </Tooltip>
                        </Col>
                    ))}
                </Row>
            )}

            <Title level={4} style={{ marginTop: '32px', marginBottom: '20px' }}>Biểu Đồ Tổng Quan Tình Trạng Kho</Title>
            <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <Spin tip="Đang tải dữ liệu biểu đồ..." style={{ display: 'block', margin: '50px auto' }} />
                ) : (
                    <Bar data={barChartConfig.data} options={barChartConfig.options} />
                )}
            </Card>

            <Title level={4} style={{ marginTop: '32px', marginBottom: '20px' }}>Biểu Đồ So Sánh Nhập/Xuất Kho</Title>
            <Card bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <Spin tip="Đang tải dữ liệu biểu đồ..." style={{ display: 'block', margin: '50px auto' }} />
                ) : stockInOutData.length > 0 ? (
                    <Line data={stockInOutChartConfig.data} options={stockInOutChartConfig.options} />
                ) : (
                    <Text type="secondary">Không có dữ liệu để hiển thị. Kiểm tra log: [DashboardPage] No stock in/out data available.</Text>
                )}
                <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginTop: '10px' }}>
                    Trục X: Ngày, Trục Y: Số lượng nhập/xuất kho.
                </Text>
            </Card>

            <Title level={4} style={{ marginTop: '32px', marginBottom: '20px' }}>Biểu Đồ Biến Động Hàng Hóa ({currentMonthYear})</Title>
            <Card title={`Biến động tồn kho (${timeRange === 'month' ? 'tháng' : timeRange === 'week' ? 'tuần' : timeRange === 'custom' && selectedDate?.isWeek ? 'tuần' : 'ngày'})`} bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <Spin tip="Đang tải dữ liệu biểu đồ..." style={{ display: 'block', margin: '50px auto' }} />
                ) : chartData.length > 0 ? (
                    <Line data={chartConfig.data} options={chartConfig.options} />
                ) : (
                    <Text type="secondary">Không có dữ liệu để hiển thị. Kiểm tra log: [DashboardPage] No chart data available.</Text>
                )}
                <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginTop: '10px' }}>
                    Trục X: Ngày, Trục Y: Tổng số lượng tồn kho.
                </Text>
            </Card>

            <Title level={4} style={{ marginTop: '32px', marginBottom: '20px' }}>Danh Sách Các Tác Vụ</Title>
            <Row gutter={[16, 16]}>
                {taskCards.map((task, index) => (
                    <Col xs={24} sm={12} md={12} lg={8} xl={24 / taskCards.length} key={index}>
                        <Link to={task.link} style={{ textDecoration: 'none' }}>
                            <Card hoverable bordered={false} style={{ textAlign: 'center', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }}>{task.icon}</div>
                                <Title level={5}>{task.title}</Title>
                                <Text type="secondary">{task.description}</Text>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default DashboardPage;