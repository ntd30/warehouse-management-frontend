import { useState } from 'react';
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
    Tag,
    Statistic
} from 'antd';
import {
    LineChartOutlined,
    BarChartOutlined,
    FileExcelOutlined,
    CalendarOutlined,
    FilterOutlined,
    WarningTwoTone,
    ClockCircleTwoTone
} from '@ant-design/icons';
import moment from 'moment';
// Giả sử bạn có một thư viện để xuất Excel, ví dụ 'xlsx'
// import * as XLSX from 'xlsx'; // Cần cài đặt: npm install xlsx

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
// const { TabPane } = Tabs; // Xóa dòng này
const { Option } = Select;

// --- Dữ liệu mẫu (trong ứng dụng thực tế sẽ lấy từ API) ---
const mockInventoryReportData = [
    { key: '1', productCode: 'SP001', productName: 'Sản phẩm Alpha', openingStock: 50, stockIn: 100, stockOut: 80, closingStock: 70, unit: 'Cái' },
    { key: '2', productCode: 'SP002', productName: 'Sản phẩm Beta', openingStock: 20, stockIn: 50, stockOut: 60, closingStock: 10, unit: 'Hộp' },
    { key: '3', productCode: 'SP003', productName: 'Sản phẩm Gamma', openingStock: 100, stockIn: 200, stockOut: 150, closingStock: 150, unit: 'Thùng' },
];

const mockProductsForForecast = [
    { id: 'SP001', name: 'Sản phẩm Alpha' },
    { id: 'SP002', name: 'Sản phẩm Beta' },
    { id: 'SP003', name: 'Sản phẩm Gamma' },
];

// Dữ liệu xuất kho 4 tuần gần nhất cho SP001 (ví dụ)
const mockStockOutHistorySP001 = {
    week1: 100, // Tuần -3
    week2: 120, // Tuần -2
    week3: 110, // Tuần -1
    week4: 130, // Tuần hiện tại
};

const mockExpiringSlowMovingData = [
    { key: 'es1', productCode: 'SP005', productName: 'Sữa Tươi Tiệt Trùng', expiryDate: moment().add(10, 'days').format('YYYY-MM-DD'), lastStockOutDate: moment().subtract(5, 'days').format('YYYY-MM-DD'), currentStock: 10, unit: 'Lốc' },
    { key: 'es2', productCode: 'SP006', productName: 'Bánh Quy Bơ', expiryDate: moment().add(15, 'days').format('YYYY-MM-DD'), lastStockOutDate: moment().subtract(2, 'days').format('YYYY-MM-DD'), currentStock: 50, unit: 'Gói' },
    { key: 'es3', productCode: 'SP007', productName: 'Nước Giải Khát Z', expiryDate: moment().add(60, 'days').format('YYYY-MM-DD'), lastStockOutDate: moment().subtract(40, 'days').format('YYYY-MM-DD'), currentStock: 30, unit: 'Chai' }, // Chậm luân chuyển
    { key: 'es4', productCode: 'SP008', productName: 'Đồ Hộp Cũ', expiryDate: moment().subtract(5, 'days').format('YYYY-MM-DD'), lastStockOutDate: moment().subtract(100, 'days').format('YYYY-MM-DD'), currentStock: 5, unit: 'Hộp' }, // Đã hết hạn & Chậm luân chuyển
];
// --- Kết thúc dữ liệu mẫu ---

const ReportsScreen = () => {
    const [inventoryForm] = Form.useForm();
    const [forecastForm] = Form.useForm();
    const [expSlowForm] = Form.useForm();

    const [inventoryReportData, setInventoryReportData] = useState([]);
    const [loadingInventory, setLoadingInventory] = useState(false);

    const [selectedProductForForecast, setSelectedProductForForecast] = useState(null);
    const [forecastValue, setForecastValue] = useState(null);
    const [forecastChartData, setForecastChartData] = useState([]); // Dữ liệu cho biểu đồ

    const [expSlowReportData, setExpSlowReportData] = useState([]);
    const [loadingExpSlow, setLoadingExpSlow] = useState(false);
    const [expSlowFilter, setExpSlowFilter] = useState('expiring'); // 'expiring' or 'slow_moving'

    const handleExportExcel = (data, filename, sheetname) => {
        if (!data || data.length === 0) {
            message.warning('Không có dữ liệu để xuất.');
            return;
        }
        try {
            // Để sử dụng XLSX, bạn cần import: import * as XLSX from 'xlsx';
            // và cài đặt: npm install xlsx
            // const worksheet = XLSX.utils.json_to_sheet(data);
            // const workbook = XLSX.utils.book_new();
            // XLSX.utils.book_append_sheet(workbook, worksheet, sheetname || "Sheet1");
            // XLSX.writeFile(workbook, `${filename || "Report"}.xlsx`);
            message.success(`Đã giả lập xuất Excel thành công: ${filename}.xlsx (Cần cài đặt thư viện 'xlsx')`);
            console.log("Dữ liệu xuất Excel:", data);
        } catch (error) {
            message.error("Lỗi khi xuất Excel. Vui lòng cài đặt thư viện 'xlsx'.");
            console.error("Lỗi xuất Excel:", error);
        }
    };

    // Xử lý Báo cáo Tồn Kho
    const onFinishInventoryReport = (values) => {
        setLoadingInventory(true);
        console.log('Lọc báo cáo tồn kho:', values);
        // Giả lập fetch dữ liệu
        setTimeout(() => {
            // Lọc dữ liệu mẫu (trong thực tế sẽ query từ DB)
            // Ở đây chỉ hiển thị lại mock data
            setInventoryReportData(mockInventoryReportData);
            setLoadingInventory(false);
            message.success('Đã tải báo cáo tồn kho.');
        }, 1000);
    };

    // Xử lý Dự Báo Nhu Cầu
    const handleForecastProductChange = (productId) => {
        setSelectedProductForForecast(productId);
        if (productId === 'SP001') { // Chỉ có dữ liệu mẫu cho SP001
            const { week1, week2, week3, week4 } = mockStockOutHistorySP001;
            const forecast = (week1 + week2 + week3 + week4) / 4;
            setForecastValue(forecast);
            // Dữ liệu cho biểu đồ (ví dụ)
            setForecastChartData([
                { week: 'Tuần -3', value: week1 },
                { week: 'Tuần -2', value: week2 },
                { week: 'Tuần -1', value: week3 },
                { week: 'Tuần hiện tại', value: week4 },
                { week: 'Tuần tới (Dự báo)', value: forecast, type: 'forecast' },
            ]);
        } else {
            setForecastValue(null);
            setForecastChartData([]);
            if (productId) message.info(`Không có dữ liệu lịch sử xuất kho cho sản phẩm này để dự báo.`);
        }
    };

    // Xử lý Báo cáo Hàng Sắp Hết Hạn / Chậm Luân Chuyển
    const onFinishExpSlowReport = (values) => {
        setLoadingExpSlow(true);
        console.log('Lọc báo cáo sắp hết hạn/chậm luân chuyển:', values);
        setExpSlowFilter(values.filterType);

        setTimeout(() => {
            let filteredData = [];
            if (values.filterType === 'expiring') {
                filteredData = mockExpiringSlowMovingData.filter(item => {
                    const expiryDate = moment(item.expiryDate);
                    const daysDiff = expiryDate.diff(moment(), 'days');
                    return daysDiff >= 0 && daysDiff <= 10; // Sắp hết hạn trong 10 ngày tới
                });
            } else if (values.filterType === 'slow_moving') {
                filteredData = mockExpiringSlowMovingData.filter(item => {
                    const lastStockOutDate = moment(item.lastStockOutDate);
                    return moment().diff(lastStockOutDate, 'days') > 30; // Không xuất kho trong 30 ngày
                });
            } else { // all_issues
                filteredData = mockExpiringSlowMovingData.filter(item => {
                    const expiryDate = moment(item.expiryDate);
                    const daysDiff = expiryDate.diff(moment(), 'days');
                    const isExpiringSoon = daysDiff >= 0 && daysDiff <= 10;
                    const isExpired = daysDiff < 0;

                    const lastStockOutDate = moment(item.lastStockOutDate);
                    const isSlowMoving = moment().diff(lastStockOutDate, 'days') > 30;
                    return isExpiringSoon || isSlowMoving || isExpired;
                });
            }
            setExpSlowReportData(filteredData);
            setLoadingExpSlow(false);
            message.success(`Đã tải báo cáo ${values.filterType === 'expiring' ? 'sắp hết hạn' : (values.filterType === 'slow_moving' ? 'chậm luân chuyển' : 'các vấn đề')}.`);
        }, 1000);
    };

    const inventoryColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', fixed: 'left', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', fixed: 'left', width: 200, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Tồn Đầu Kỳ', dataIndex: 'openingStock', key: 'openingStock', align: 'right', width: 120 },
        { title: 'Nhập Trong Kỳ', dataIndex: 'stockIn', key: 'stockIn', align: 'right', width: 120 },
        { title: 'Xuất Trong Kỳ', dataIndex: 'stockOut', key: 'stockOut', align: 'right', width: 120 },
        { title: 'Tồn Cuối Kỳ', dataIndex: 'closingStock', key: 'closingStock', align: 'right', width: 120, render: (text) => <Text strong>{text}</Text> },
    ];

    const expSlowColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', width: 200, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        {
            title: 'Ngày Hết Hạn', dataIndex: 'expiryDate', key: 'expiryDate', width: 150,
            render: (text) => {
                const date = moment(text);
                const diffDays = date.diff(moment(), 'days');
                if (diffDays < 0) return <Tag color="red">Đã hết hạn ({date.format('DD/MM/YYYY')})</Tag>;
                if (diffDays <= 10) return <Tag color="orange">Còn {diffDays} ngày ({date.format('DD/MM/YYYY')})</Tag>;
                return date.format('DD/MM/YYYY');
            }
        },
        {
            title: 'Ngày Xuất Kho Gần Nhất', dataIndex: 'lastStockOutDate', key: 'lastStockOutDate', width: 180,
            render: (text) => {
                const date = moment(text);
                const diffDays = moment().diff(date, 'days');
                if (diffDays > 30) return <Tag color="volcano">{date.format('DD/MM/YYYY')} (Chậm)</Tag>;
                return date.format('DD/MM/YYYY');
            }
        },
        { title: 'Tồn Kho Hiện Tại', dataIndex: 'currentStock', key: 'currentStock', align: 'right', width: 150 },
    ];

    // Placeholder cho biểu đồ
    const renderForecastChart = () => {
        if (!selectedProductForForecast || !forecastValue) {
            return <Paragraph type="secondary" style={{ textAlign: 'center', padding: '20px' }}>Vui lòng chọn sản phẩm để xem dự báo.</Paragraph>;
        }
        // Trong thực tế, bạn sẽ dùng thư viện biểu đồ ở đây (ví dụ: Ant Design Charts, Recharts)
        return (
            <div style={{ padding: '20px', border: '1px dashed #ccc', borderRadius: '4px', textAlign: 'center' }}>
                <Title level={5}>Biểu đồ Dự Báo cho: {mockProductsForForecast.find(p => p.id === selectedProductForForecast)?.name}</Title>
                <Statistic title="Dự báo SL xuất tuần tới" value={forecastValue} precision={0} prefix={<LineChartOutlined />} suffix="đơn vị" />
                <Paragraph style={{ marginTop: 10 }}>Dữ liệu lịch sử (4 tuần gần nhất):</Paragraph>
                <Space direction="vertical" align="start">
                    {forecastChartData.filter(d => d.type !== 'forecast').map(d => (
                        <Text key={d.week}>{d.week}: {d.value} đơn vị</Text>
                    ))}
                </Space>
                <Paragraph type="secondary" style={{ marginTop: 20 }}>(Đây là placeholder cho biểu đồ. Cần tích hợp thư viện biểu đồ để hiển thị trực quan hơn)</Paragraph>
            </div>
        );
    };

    // Tạo mảng items cho Tabs
    const tabItems = [
        {
            label: <Space><BarChartOutlined />Báo Cáo Tồn Kho</Space>,
            key: '1',
            children: (
                <>
                    <Card title="Bộ Lọc Báo Cáo Tồn Kho" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Form form={inventoryForm} layout="vertical" onFinish={onFinishInventoryReport}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={10}>
                                    <Form.Item name="dateRange" label="Khoảng Thời Gian" rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}>
                                        <RangePicker style={{ width: '100%' }} picker="date" />
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
                                            <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel(inventoryReportData, 'BaoCaoTonKho', 'TonKho')}>
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
                            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }}
                        />
                    </Card>
                </>
            ),
        },
        {
            label: <Space><LineChartOutlined />Dự Báo Nhu Cầu Nhập Hàng</Space>,
            key: '2',
            children: (
                <Card title="Dự Báo Nhu Cầu (Phương Pháp SMA)" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}>
                            <Form form={forecastForm} layout="vertical">
                                <Form.Item name="productForForecast" label="Chọn Sản Phẩm Để Dự Báo" rules={[{ required: true, message: 'Vui lòng chọn sản phẩm!' }]}>
                                    <Select
                                        showSearch
                                        placeholder="Chọn sản phẩm"
                                        optionFilterProp="children"
                                        onChange={handleForecastProductChange}
                                        filterOption={(input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                        options={mockProductsForForecast.map(p => ({ value: p.id, label: p.name }))}
                                        allowClear
                                    />
                                </Form.Item>
                            </Form>
                            {selectedProductForForecast && forecastValue !== null && (
                                <Card size="small" style={{ marginTop: 16 }}>
                                    <Statistic
                                        title={`Dự báo SL xuất tuần tới cho ${mockProductsForForecast.find(p => p.id === selectedProductForForecast)?.name}`}
                                        value={forecastValue}
                                        precision={0}
                                        valueStyle={{ color: '#3f8600' }}
                                        prefix={<LineChartOutlined />}
                                        suffix="đơn vị"
                                    />
                                    <Paragraph type="secondary" style={{ fontSize: '0.85em', marginTop: 8 }}>
                                        Dựa trên số liệu xuất kho 4 tuần gần nhất: <br />
                                        (Tuần -3: {mockStockOutHistorySP001.week1} + Tuần -2: {mockStockOutHistorySP001.week2} + Tuần -1: {mockStockOutHistorySP001.week3} + Tuần hiện tại: {mockStockOutHistorySP001.week4}) / 4
                                    </Paragraph>
                                </Card>
                            )}
                        </Col>
                        <Col xs={24} md={16}>
                            {renderForecastChart()}
                        </Col>
                    </Row>
                </Card>
            ),
        },
        {
            label: <Space><WarningTwoTone twoToneColor="#faad14" />Hàng Sắp Hết Hạn / Chậm Luân Chuyển</Space>,
            key: '3',
            children: (
                <>
                    <Card title="Bộ Lọc Báo Cáo" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Form form={expSlowForm} layout="vertical" onFinish={onFinishExpSlowReport} initialValues={{ filterType: 'expiring' }}>
                            <Row gutter={16}>
                                <Col xs={24} sm={12} md={10}>
                                    <Form.Item name="filterType" label="Loại Vấn Đề" rules={[{ required: true, message: 'Vui lòng chọn loại vấn đề!' }]}>
                                        <Select>
                                            <Option value="expiring"><Space><ClockCircleTwoTone />Sắp Hết Hạn (trong 10 ngày)</Space></Option>
                                            <Option value="slow_moving"><Space><CalendarOutlined />Chậm Luân Chuyển (không xuất &gt;30 ngày)</Space></Option>
                                            <Option value="all_issues"><Space><WarningTwoTone twoToneColor="#eb2f96" />Tất cả vấn đề (Hết hạn, Sắp hết hạn, Chậm)</Space></Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12} md={8}>
                                    <Form.Item label=" ">
                                        <Space>
                                            <Button type="primary" htmlType="submit" icon={<FilterOutlined />} loading={loadingExpSlow}>
                                                Xem Báo Cáo
                                            </Button>
                                            <Button icon={<FileExcelOutlined />} onClick={() => handleExportExcel(expSlowReportData, `BaoCaoVanDe_${expSlowFilter}`, 'VanDeTonKho')}>
                                                Xuất Excel
                                            </Button>
                                        </Space>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    <Card title={`Kết Quả: ${expSlowFilter === 'expiring' ? 'Hàng Sắp Hết Hạn' : (expSlowFilter === 'slow_moving' ? 'Hàng Chậm Luân Chuyển' : 'Các Vấn Đề Tồn Kho')}`} bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                        <Table
                            columns={expSlowColumns}
                            dataSource={expSlowReportData}
                            loading={loadingExpSlow}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            pagination={{ pageSize: 10 }}
                        />
                    </Card>
                </>
            ),
        },
    ];

    return (
        <Tabs
            defaultActiveKey="1"
            type="card"
            items={tabItems} // Sử dụng items thay cho TabPane
        />
    );
};

export default ReportsScreen;
