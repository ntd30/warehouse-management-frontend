import { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Form,
    DatePicker,
    Button,
    Select,
    Table,
    Space,
    Typography,
    message,
    Tabs,
    Tag
} from 'antd';
import {
    BarChartOutlined,
    LineChartOutlined,
    FileExcelOutlined,
    FilterOutlined,
    WarningTwoTone
} from '@ant-design/icons';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title as ChartTitle, Tooltip, Legend } from 'chart.js';
import { fetchWarehouseReportAPI, exportWarehouseReportAPI, fetchProductReportAPI, exportProductReportAPI, fetchDemandForecastAPI, GetAllProduct } from '../services/api.service';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, ChartTitle, Tooltip, Legend);

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const ReportsScreen = () => {
    const [inventoryForm] = Form.useForm();
    const [expSlowForm] = Form.useForm();
    const [forecastForm] = Form.useForm();
    const [inventoryReportData, setInventoryReportData] = useState([]);
    const [inventoryPagination, setInventoryPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });
    const [loadingInventory, setLoadingInventory] = useState(false);
    const [expSlowReportData, setExpSlowReportData] = useState([]);
    const [expSlowPagination, setExpSlowPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });
    const [loadingExpSlow, setLoadingExpSlow] = useState(false);
    const [forecastData, setForecastData] = useState([]);
    const [loadingForecast, setLoadingForecast] = useState(false);
    const [products, setProducts] = useState([]);
    const reportType = Form.useWatch('reportType', inventoryForm) || 'daily';

 useEffect(() => {
    const fetchProducts = async () => {
        try {
            const startOfMonth = moment().startOf('month').toISOString(); // 01/05/2025 00:00:00
            const currentDate = moment().toISOString(); // 27/05/2025 09:26:00

            console.log('Calling fetchProductReportAPI with:', { filterType: 'all', page: 0, size: 1000, startDate: startOfMonth, endDate: currentDate });
            const response = await fetchProductReportAPI('all', 0, 1000, startOfMonth, currentDate);

            console.log('API Response:', response);

            if (response.data && Array.isArray(response.data.content)) {
                console.log('Products data:', response.data.content);
                const formattedProducts = response.data.content
                    .filter(item => item && item.productCode) // Lọc bỏ các item không hợp lệ
                    .map(item => ({
                        productCode: item.productCode,
                        productName: item.productName || `Sản phẩm ${item.productCode}`
                    }));
                console.log('Formatted Products:', formattedProducts); // Debug sau khi ánh xạ
                setProducts(formattedProducts);
                if (formattedProducts.length === 0) {
                    console.warn('No products found in the report.');
                    message.warning('Không tìm thấy sản phẩm trong báo cáo.');
                }
            } else {
                throw new Error('Dữ liệu từ API không hợp lệ hoặc rỗng.');
            }
        } catch (error) {
            console.error('[fetchProducts] Lỗi khi lấy danh sách sản phẩm:', error);
            message.error('Lỗi khi lấy danh sách sản phẩm: ' + (error.message || 'Kiểm tra console để biết thêm chi tiết.'));
            setProducts([]);
        }
    };
    fetchProducts();
}, []);

    const onFinishInventoryReport = async (values, page = 0, size = 10) => {
        setLoadingInventory(true);
        try {
            const { dateRange, reportType } = values;
            let startDate, endDate;
            if (dateRange && dateRange.length === 2) {
                if (reportType === 'daily') {
                    startDate = dateRange[0].startOf('day').toISOString();
                    endDate = dateRange[1].endOf('day').toISOString();
                } else if (reportType === 'monthly') {
                    startDate = dateRange[0].startOf('month').toISOString();
                    endDate = dateRange[1].endOf('month').toISOString();
                } else if (reportType === 'yearly') {
                    startDate = dateRange[0].startOf('year').toISOString();
                    endDate = dateRange[1].endOf('year').toISOString();
                }
            } else {
                throw new Error('Vui lòng chọn khoảng thời gian.');
            }

            const response = await fetchWarehouseReportAPI(startDate, endDate, page, size);
            if (!response.data || !Array.isArray(response.data.content)) {
                throw new Error('Dữ liệu từ API không hợp lệ.');
            }

            const formattedData = response.data.content.map((item, index) => ({
                key: (page * size + index).toString(),
                productCode: item.productCode,
                productName: item.productName || `Sản phẩm ${item.productCode}`,
                unit: item.unit || 'Cái',
                openingStock: item.openingStock,
                stockIn: item.totalIn,
                stockOut: item.totalOut,
                closingStock: item.closingStock
            }));

            setInventoryReportData(formattedData);
            setInventoryPagination({
                page: response.data.page,
                size: response.data.size,
                totalElements: response.data.totalElements,
                totalPages: response.data.totalPages
            });
            message.success('Đã tải báo cáo tồn kho thành công.');
        } catch (error) {
            message.error(error.message || 'Lỗi khi tải báo cáo tồn kho.');
            setInventoryReportData([]);
        } finally {
            setLoadingInventory(false);
        }
    };

    const onFinishExpSlowReport = async (values, page = 0, size = 10) => {
        setLoadingExpSlow(true);
        try {
            const response = await fetchProductReportAPI(values.filterType, page, size);
            if (!response.data || !Array.isArray(response.data.content)) {
                throw new Error('Dữ liệu từ API không hợp lệ.');
            }

            const formattedData = response.data.content.map((item, index) => ({
                key: (page * size + index).toString(),
                productCode: item.productCode,
                productName: item.productName || `Sản phẩm ${item.productCode}`,
                expiryDate: item.expirationDate,
                lastStockOutDate: item.lastOutDate,
                currentStock: item.currentStock,
                unit: item.unit || 'Cái'
            }));

            setExpSlowReportData(formattedData);
            setExpSlowPagination({
                page: response.data.page,
                size: response.data.size,
                totalElements: response.data.totalElements,
                totalPages: response.data.totalPages
            });
            message.success(`Đã tải báo cáo ${values.filterType === 'near_expiration' ? 'sắp hết hạn' : values.filterType === 'slow_moving' ? 'chậm luân chuyển' : 'tất cả sản phẩm'}.`);
        } catch (error) {
            message.error('Lỗi khi tải báo cáo hàng sắp hết hạn/chậm luân chuyển.');
            setExpSlowReportData([]);
        } finally {
            setLoadingExpSlow(false);
        }
    };

    const onFinishForecastReport = async (values) => {
        setLoadingForecast(true);
        try {
            const response = await fetchDemandForecastAPI(values.productCode);
            if (!response.data || !Array.isArray(response.data)) {
                throw new Error('Dữ liệu từ API không hợp lệ.');
            }

            const formattedData = response.data.map((item, index) => ({
                key: index.toString(),
                productCode: item.productCode,
                forecastQuantity: item.forecastQuantity,
                currentStock: item.currentStock,
                suggestedIn: item.suggestedIn
            }));

            setForecastData(formattedData);
            message.success('Đã tải dự báo nhu cầu nhập hàng thành công.');
        } catch (error) {
            message.error(error.message || 'Lỗi khi tải dự báo nhu cầu nhập hàng.');
            setForecastData([]);
        } finally {
            setLoadingForecast(false);
        }
    };

    const handleExportProductReportExcel = async (filterType) => {
        try {
            const response = await exportProductReportAPI(filterType);
            if (!response.data || !(response.data instanceof Blob)) {
                throw new Error('Phản hồi từ API không chứa dữ liệu Blob hợp lệ');
            }

            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `product_report_${moment().format('YYYYMMDD')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            message.success('Xuất file Excel thành công!');
        } catch (error) {
            message.error('Lỗi khi xuất Excel front API.');
        }
    };

    const handleExportForecastExcel = (data) => {
        if (!data || data.length === 0) {
            message.warning('Không có dữ liệu để xuất.');
            return;
        }
        try {
            const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
                'Mã Sản Phẩm': item.productCode,
                'Số Lượng Dự Báo': item.forecastQuantity,
                'Tồn Kho Hiện Tại': item.currentStock,
                'Lượng Nhập Gợi Ý': item.suggestedIn
            })));
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Dự Báo Nhu Cầu');
            XLSX.writeFile(workbook, `DuBaoNhuCau_${moment().format('YYYYMMDD')}.xlsx`);
            message.success('Xuất file Excel thành công!');
        } catch (error) {
            message.error('Lỗi khi xuất Excel.');
        }
    };

    const inventoryColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', fixed: 'left', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', fixed: 'left', width: 200, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Tồn Đầu Kỳ', dataIndex: 'openingStock', key: 'openingStock', align: 'right', width: 120 },
        { title: 'Nhập Trong Kỳ', dataIndex: 'stockIn', key: 'stockIn', align: 'right', width: 120 },
        { title: 'Xuất Trong Kỳ', dataIndex: 'stockOut', key: 'stockOut', align: 'right', width: 120 },
        { title: 'Tồn Cuối Kỳ', dataIndex: 'closingStock', key: 'closingStock', align: 'right', width: 120, render: (text) => <Text strong>{text}</Text> }
    ];

    const expSlowColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', width: 200, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        {
            title: 'Ngày Hết Hạn',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            width: 150,
            render: (text) => {
                if (!text) return '-';
                const date = moment(text);
                const diffDays = date.diff(moment(), 'days');
                if (diffDays < 0) return <Tag color="red">Đã hết hạn ({date.format('DD/MM/YYYY')})</Tag>;
                if (diffDays <= 10) return <Tag color="orange">Còn {diffDays} ngày ({date.format('DD/MM/YYYY')})</Tag>;
                return date.format('DD/MM/YYYY');
            }
        },
        {
            title: 'Ngày Xuất Kho Gần Nhất',
            dataIndex: 'lastStockOutDate',
            key: 'lastStockOutDate',
            width: 180,
            render: (text) => {
                if (!text) return '-';
                const date = moment(text);
                const diffDays = moment().diff(date, 'days');
                if (diffDays > 30) return <Tag color="volcano">{date.format('DD/MM/YYYY')} (Chậm)</Tag>;
                return date.format('DD/MM/YYYY');
            }
        },
        { title: 'Tồn Kho Hiện Tại', dataIndex: 'currentStock', key: 'currentStock', align: 'right', width: 150 }
    ];

    const forecastColumns = [
        { title: 'Mã Sản Phẩm', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Số Lượng Dự Báo', dataIndex: 'forecastQuantity', key: 'forecastQuantity', align: 'right', width: 150 },
        { title: 'Tồn Kho Hiện Tại', dataIndex: 'currentStock', key: 'currentStock', align: 'right', width: 150 },
        { title: 'Lượng Nhập Gợi Ý', dataIndex: 'suggestedIn', key: 'suggestedIn', align: 'right', width: 150, render: (text) => <Text strong>{text}</Text> }
    ];

    const handleTableChange = (pagination, form, setter, fetchFunction) => {
        const { current, pageSize } = pagination;
        form.validateFields().then(values => {
            fetchFunction(values, current - 1, pageSize);
        });
    };

    const renderInventoryChart = () => {
        if (inventoryReportData.length === 0) {
            return <Paragraph type="secondary" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu để hiển thị biểu đồ.</Paragraph>;
        }

        const chartData = {
            labels: inventoryReportData.map(item => item.productCode),
            datasets: [
                {
                    label: 'Tồn Đầu Kỳ',
                    data: inventoryReportData.map(item => item.openingStock || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Tồn Cuối Kỳ',
                    data: inventoryReportData.map(item => item.closingStock || 0),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Số lượng' } },
                x: { title: { display: true, text: 'Mã hàng' } }
            },
            plugins: {
                legend: { position: 'top', labels: { font: { size: 14 } } },
                title: { display: true, text: `Báo cáo Tồn Kho (${reportType === 'daily' ? 'Ngày' : reportType === 'monthly' ? 'Tháng' : 'Năm'})`, font: { size: 18 } }
            }
        };

        return (
            <Card title="Biểu đồ Tồn Kho" style={{ marginTop: 24, height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
            </Card>
        );
    };

    const renderForecastChart = () => {
        if (forecastData.length === 0) {
            return <Paragraph type="secondary" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu để hiển thị biểu đồ.</Paragraph>;
        }

        const chartData = {
            labels: forecastData.map(item => item.productCode),
            datasets: [
                {
                    label: 'Số Lượng Dự Báo',
                    data: forecastData.map(item => item.forecastQuantity || 0),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Tồn Kho Hiện Tại',
                    data: forecastData.map(item => item.currentStock || 0),
                    backgroundColor: 'rgba(255, 206, 86, 0.8)',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Lượng Nhập Gợi Ý',
                    data: forecastData.map(item => item.suggestedIn || 0),
                    backgroundColor: 'rgba(75, 192, 192, 0.8)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Số lượng' } },
                x: { title: { display: true, text: 'Mã sản phẩm' } }
            },
            plugins: {
                legend: { position: 'top', labels: { font: { size: 14 } } },
                title: { display: true, text: 'Dự Báo Nhu Cầu Nhập Hàng', font: { size: 18 } }
            }
        };

        return (
            <Card title="Biểu Đồ Dự Báo Nhu Cầu" style={{ marginTop: 24, height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
            </Card>
        );
    };

    const tabItems = [
        {
            label: <Space><BarChartOutlined />Báo Cáo Tồn Kho</Space>,
            key: '1',
            children: (
                <>
                    <Card title="Bộ Lọc Báo Cáo Tồn Kho" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Form form={inventoryForm} layout="vertical" onFinish={(values) => onFinishInventoryReport(values)}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={10}>
                                    <Form.Item
                                        name="dateRange"
                                        label="Khoảng Thời Gian"
                                        rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
                                    >
                                        <RangePicker
                                            style={{ width: '100%' }}
                                            picker={reportType === 'monthly' ? 'month' : reportType === 'yearly' ? 'year' : 'date'}
                                            format={reportType === 'monthly' ? 'MM/YYYY' : reportType === 'yearly' ? 'YYYY' : 'DD/MM/YYYY'}
                                            disabledDate={(current) => current && current > moment().endOf('day')}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={6}>
                                    <Form.Item name="reportType" label="Loại Báo Cáo" initialValue="daily">
                                        <Select>
                                            <Option value="daily">Theo Ngày</Option>
                                            <Option value="monthly">Theo Tháng</Option>
                                            <Option value="yearly">Theo Năm</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={24} md={8}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <Button type="primary" htmlType="submit" icon={<FilterOutlined />} loading={loadingInventory}>
                                                Xem Báo Cáo
                                            </Button>
                                            <Button
                                                icon={<FileExcelOutlined />}
                                                onClick={() => {
                                                    const { dateRange, reportType } = inventoryForm.getFieldsValue();
                                                    if (dateRange && dateRange.length === 2) {
                                                        let startDate, endDate;
                                                        if (reportType === 'daily') {
                                                            startDate = dateRange[0].startOf('day').toISOString();
                                                            endDate = dateRange[1].endOf('day').toISOString();
                                                        } else if (reportType === 'monthly') {
                                                            startDate = dateRange[0].startOf('month').toISOString();
                                                            endDate = dateRange[1].endOf('month').toISOString();
                                                        } else if (reportType === 'yearly') {
                                                            startDate = dateRange[0].startOf('year').toISOString();
                                                            endDate = dateRange[1].endOf('year').toISOString();
                                                        }
                                                        exportWarehouseReportAPI(startDate, endDate).then(response => {
                                                            const url = window.URL.createObjectURL(response.data);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.setAttribute('download', `BaoCaoTonKho_${moment().format('YYYYMMDD')}.xlsx`);
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                            message.success('Xuất file Excel thành công!');
                                                        }).catch(error => {
                                                            message.error('Lỗi khi xuất Excel từ API.');
                                                        });
                                                    } else {
                                                        message.warning('Vui lòng chọn khoảng thời gian để xuất Excel.');
                                                    }
                                                }}
                                            >
                                                Xuất Excel
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    <Card title="Kết Quả Báo Cáo Tồn Kho" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Table
                            columns={inventoryColumns}
                            dataSource={inventoryReportData}
                            loading={loadingInventory}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            pagination={{
                                current: inventoryPagination.page + 1,
                                pageSize: inventoryPagination.size,
                                total: inventoryPagination.totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }, inventoryForm, setInventoryReportData, onFinishInventoryReport)
                            }}
                        />
                    </Card>
                    {renderInventoryChart()}
                </>
            )
        },
        {
            label: <Space><LineChartOutlined />Dự Báo Nhu Cầu Nhập Hàng</Space>,
            key: '2',
            children: (
                <>
                    <Card title="Bộ Lọc Dự Báo Nhu Cầu" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Form form={forecastForm} layout="vertical" onFinish={onFinishForecastReport}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name="productCode"
                                        label="Sản Phẩm"
                                        initialValue="all"
                                    >
                                        <Select>
                                            <Option value="all">Tất Cả Sản Phẩm</Option>
                                            {products.map(product => (
                                                <Option key={product.productCode} value={product.productCode}>
                                                    {product.productCode} - {product.productName}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <Button type="primary" htmlType="submit" icon={<FilterOutlined />} loading={loadingForecast}>
                                                Xem Dự Báo
                                            </Button>
                                            <Button
                                                icon={<FileExcelOutlined />}
                                                onClick={() => {
                                                    handleExportForecastExcel(forecastData);
                                                }}
                                            >
                                                Xuất Excel
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    <Card title="Kết Quả Dự Báo Nhu Cầu" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Table
                            columns={forecastColumns}
                            dataSource={forecastData}
                            loading={loadingForecast}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                        />
                    </Card>
                    {renderForecastChart()}
                </>
            )
        },
        {
            label: <Space><WarningTwoTone twoToneColor="#faad14" />Hàng Sắp Hết Hạn / Chậm Luân Chuyển</Space>,
            key: '3',
            children: (
                <>
                    <Card title="Bộ Lọc Báo Cáo Sản Phẩm" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Form form={expSlowForm} layout="vertical" onFinish={(values) => onFinishExpSlowReport(values)}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item
                                        name="filterType"
                                        label="Loại Báo Cáo"
                                        initialValue="all"
                                    >
                                        <Select>
                                            <Option value="all">Tất Cả Sản Phẩm</Option>
                                            <Option value="near_expiration">Sắp Hết Hạn</Option>
                                            <Option value="slow_moving">Chậm Luân Chuyển</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <Button type="primary" htmlType="submit" icon={<FilterOutlined />} loading={loadingExpSlow}>
                                                Xem Báo Cáo
                                            </Button>
                                            <Button
                                                icon={<FileExcelOutlined />}
                                                onClick={() => {
                                                    const { filterType } = expSlowForm.getFieldsValue();
                                                    handleExportProductReportExcel(filterType);
                                                }}
                                            >
                                                Xuất Excel
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    <Card title="Kết Quả Báo Cáo Sản Phẩm" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Table
                            columns={expSlowColumns}
                            dataSource={expSlowReportData}
                            loading={loadingExpSlow}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            pagination={{
                                current: expSlowPagination.page + 1,
                                pageSize: expSlowPagination.size,
                                total: expSlowPagination.totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50'],
                                onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }, expSlowForm, setExpSlowReportData, onFinishExpSlowReport)
                            }}
                        />
                    </Card>
                </>
            )
        }
    ];

    return <Tabs defaultActiveKey="1" type="card" items={tabItems} />;
};

export default ReportsScreen;