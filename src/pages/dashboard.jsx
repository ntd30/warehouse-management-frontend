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
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend,
    Filler,
} from 'chart.js';
import {
    fetchWarehouseReportAPI,
    fetchProductReportAPI,
} from '../services/api.service';
import axios from '../services/axios.customize';
import moment from 'moment'; // Thêm moment để xử lý ngày tháng
import { Link } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, Legend, Filler);

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
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState('month');
    const [selectedDate, setSelectedDate] = useState(null); // Lưu ngày hoặc tuần được chọn
    const currentMonthYear = new Date().toLocaleString('vi-VN', { month: 'long', year: 'numeric' });

    useEffect(() => {
        const fetchData = async () => {
            console.log('[DashboardPage] Starting fetchData with timeRange:', timeRange, 'selectedDate:', selectedDate);
            setLoading(true);
            console.log('[DashboardPage] Set loading to true');

            try {
                let startDate, endDate;
                const today = new Date();
                endDate = today.toISOString().split('T')[0] + 'T23:59:59';

                if (timeRange === 'custom' && selectedDate) {
                    // Xử lý khi chọn ngày hoặc tuần cụ thể
                    if (selectedDate.isWeek) {
                        // Nếu chọn tuần
                        startDate = moment(selectedDate.date).startOf('week').toISOString().split('T')[0] + 'T00:00:00';
                        endDate = moment(selectedDate.date).endOf('week').toISOString().split('T')[0] + 'T23:59:59';
                    } else {
                        // Nếu chọn ngày
                        startDate = moment(selectedDate.date).toISOString().split('T')[0] + 'T00:00:00';
                        endDate = moment(selectedDate.date).toISOString().split('T')[0] + 'T23:59:59';
                    }
                } else {
                    // Xử lý các khoảng thời gian mặc định
                    if (timeRange === 'month') {
                        startDate = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0] + 'T00:00:00';
                    } else if (timeRange === 'week') {
                        startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0] + 'T00:00:00';
                    } else {
                        startDate = new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0] + 'T00:00:00';
                    }
                }
                console.log('[DashboardPage] Calculated date range:', { startDate, endDate });

                const countResponse = await axios.get('/api/products/count');
                console.log('[DashboardPage] Response from /api/products/count:', countResponse.data);
                const totalProducts = countResponse.data || 0;

                const warehouseResponse = await fetchWarehouseReportAPI(startDate, endDate, timeRange);
                console.log('[DashboardPage] Response from /api/reports/warehouse:', warehouseResponse.data);
                const warehouseData = warehouseResponse.data || [];
                const totalStock = warehouseData.reduce((sum, item) => sum + (item.closingStock || 0), 0);
                const stockInThisMonth = warehouseData.reduce((sum, item) => sum + (item.totalIn || 0), 0);
                const stockOutThisMonth = warehouseData.reduce((sum, item) => sum + (item.totalOut || 0), 0);
                const lastStockCheck = warehouseData.length > 0 ? new Date().toISOString().split('T')[0] : 'N/A';
                console.log('[DashboardPage] Processed warehouse data:', {
                    totalStock,
                    stockInThisMonth,
                    stockOutThisMonth,
                    lastStockCheck,
                    rawData: warehouseData,
                });

                const newInventoryData = {
                    totalProducts,
                    totalStock,
                    stockInThisMonth,
                    stockOutThisMonth,
                    lastStockCheck,
                };
                setInventoryData(newInventoryData);
                console.log('[DashboardPage] Updated inventoryData:', newInventoryData);

                const productResponse = await fetchProductReportAPI(timeRange);
                console.log('[DashboardPage] Response from /api/reports/products:', productResponse.data);
                const newChartData = productResponse.data || [];
                setChartData(newChartData);
                console.log('[DashboardPage] Updated chartData:', newChartData);
            } catch (err) {
                console.error('[DashboardPage] Error in fetchData:', err);
                console.error('[DashboardPage] Error details:', {
                    message: err.message,
                    stack: err.stack,
                    response: err.response ? err.response.data : 'No response data',
                });
                message.error('Lỗi khi tải dữ liệu: ' + (err.message || 'Không rõ nguyên nhân'));
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
        { title: 'SL nhập trong tháng', value: inventoryData.stockInThisMonth, icon: <LoginOutlined />, precision: 0, suffix: 'đơn vị', tooltip: 'Tính đến hiện tại' },
        { title: 'SL xuất trong tháng', value: inventoryData.stockOutThisMonth, icon: <LogoutOutlined />, precision: 0, suffix: 'đơn vị', tooltip: 'Tính đến hiện tại' },
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
            labels: chartData.map(item => item.day),
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
                        setSelectedDate(null); // Reset ngày chọn khi thay đổi timeRange
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

            <Title level={4} style={{ marginTop: '32px', marginBottom: '20px' }}>Biểu Đồ Biến Động Hàng Hóa ({currentMonthYear})</Title>
            <Card title={`Biến động tồn kho (${timeRange === 'month' ? 'tháng' : timeRange === 'week' ? 'tuần' : timeRange === 'custom' && selectedDate?.isWeek ? 'tuần' : 'ngày'})`} bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {loading ? (
                    <Spin tip="Đang tải dữ liệu biểu đồ..." style={{ display: 'block', margin: '50px auto' }} />
                ) : chartData.length > 0 ? (
                    <Line data={chartConfig.data} options={chartConfig.options} />
                ) : (
                    <Text type="secondary">Không có dữ liệu để hiển thị.</Text>
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