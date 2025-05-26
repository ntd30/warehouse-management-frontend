import { Row, Col, Card, Statistic, Typography, Space, Tooltip, message } from 'antd';
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
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { countProductsAPI, countStockAPI, countTotalExportQuantityAPI, countTotalImportQuantityAPI } from '../services/api.service';

const { Title, Text } = Typography;

// Dữ liệu mẫu cho biểu đồ (chỉ để minh họa)
const chartData = [
    { day: '1', value: 150 }, { day: '2', value: 120 }, { day: '3', value: 130 },
    { day: '4', value: 100 }, { day: '5', value: 80 }, { day: '6', value: 90 },
    { day: '7', value: 60 }, { day: '8', value: 70 }, { day: '9', value: 50 },
    { day: '10', value: 65 }, { day: '11', value: 40 }, { day: '12', value: 50 },
    // ... thêm dữ liệu cho các ngày còn lại
];

const DashboardPage = () => {
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalStock, setTotalStock] = useState(0);
    const [totalImportQuantity, setTotalImportQuantity] = useState(0);
    const [totalExportQuantity, setTotalExportQuantity] = useState(0);
    const currentMonthYear = "Tháng 5, 2025"; // Có thể tạo động

    // Dữ liệu mẫu (bạn sẽ thay thế bằng dữ liệu thực tế từ API)
    const inventoryData = {
        totalProducts: totalProducts,
        totalStock: totalStock,
        stockInThisMonth: totalImportQuantity,
        stockOutThisMonth: totalExportQuantity,
        lastStockCheck: '10/05/2025',
    };

    const statCards = [
        {
            title: 'Tổng SP khác nhau',
            value: inventoryData.totalProducts,
            icon: <DropboxOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
            precision: 0,
            suffix: 'sản phẩm',
            tooltip: 'Đếm theo mã sản phẩm',
        },
        {
            title: 'Tổng SL tồn kho',
            value: inventoryData.totalStock,
            icon: <BoxPlotOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
            precision: 0,
            suffix: 'đơn vị',
            tooltip: 'Tổng đơn vị hàng hóa',
        },
        {
            title: 'Tổng SL nhập',
            value: inventoryData.stockInThisMonth,
            icon: <LoginOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
            precision: 0,
            suffix: 'đơn vị',
            tooltip: 'Tính đến hiện tại',
        },
        {
            title: 'Tổng SL xuất',
            value: inventoryData.stockOutThisMonth,
            icon: <LogoutOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
            precision: 0,
            suffix: 'đơn vị',
            tooltip: 'Tính đến hiện tại',
        },
        // {
        //     title: 'Kiểm kho gần nhất',
        //     value: inventoryData.lastStockCheck,
        //     icon: <CalendarOutlined style={{ fontSize: '24px', color: '#f5222d' }} />,
        //     isDate: true, // Đánh dấu để không hiển thị như số
        //     tooltip: 'Ngày hoàn thành kiểm kê',
        // },
    ];

    const taskCards = [
        { title: 'Quản lý Nhập Kho', icon: <LoginOutlined />, description: 'Tạo phiếu nhập, xem lịch sử', link: '/stock-in' },
        { title: 'Quản lý Xuất Kho', icon: <LogoutOutlined />, description: 'Tạo phiếu xuất, xem lịch sử', link: '/stock-out' },
        { title: 'Quản lý Kiểm Kê', icon: <CarryOutOutlined />, description: 'Tạo phiếu, đối chiếu số liệu', link: '/stock-check' },
        { title: 'Quản lý Báo Cáo', icon: <LineChartOutlined />, description: 'Báo cáo tồn kho', link: '/reports' },
        { title: 'Quản lý Quyền Hạn', icon: <UserOutlined />, description: 'Người dùng, phân quyền', link: '/permissions' },
        { title: 'Cài Đặt', icon: <SettingOutlined />, description: 'Sản phẩm, kho', link: '/settings' },
    ];

    // Placeholder cho biểu đồ SVG (tương tự như bản HTML)
    const renderChartPlaceholder = () => (
        <svg viewBox="0 0 400 200" style={{ width: '100%', height: 'auto' }} aria-labelledby="chartTitleAntd" aria-describedby="chartDescAntd">
            <title id="chartTitleAntd">Biểu đồ biến động tồn kho</title>
            <desc id="chartDescAntd">Biểu đồ đường thể hiện sự thay đổi tổng số lượng tồn kho theo ngày trong tháng.</desc>
            <line x1="30" y1="10" x2="30" y2="170" stroke="#D1D5DB" strokeWidth="1" />
            <text x="5" y="15" fontSize="10" fill="#6B7280">SL</text>
            <text x="5" y="170" fontSize="10" fill="#6B7280">0</text>
            <line x1="30" y1="170" x2="380" y2="170" stroke="#D1D5DB" strokeWidth="1" />
            <text x="30" y="185" fontSize="10" fill="#6B7280">Ngày 1</text>
            <text x="350" y="185" fontSize="10" fill="#6B7280">Ngày 31</text>
            <polyline points="30,150 60,120 90,130 120,100 150,80 180,90 210,60 240,70 270,50 300,65 330,40 360,50"
                fill="none" stroke="#1890ff" strokeWidth="2" />
            {chartData.slice(0, 12).map((point, index) => ( // Giới hạn số điểm vẽ để tránh quá nhiều
                <circle key={index} cx={30 + index * (330 / 11)} cy={170 - (point.value * 160 / 200)} r="3" fill="#1890ff" />
            ))}
        </svg>
    );

    useEffect(() => {
        const countProducts = async () => {
            try {
                const res = await countProductsAPI();
                setTotalProducts(res.data);
            } catch (error) {
                message.error("Lỗi khi lấy số lượng sản phẩm");
            }
        }

        const countStock = async () => {
            try {
                const res = await countStockAPI();
                setTotalStock(res.data);
            } catch (error) {
                message.error("Lỗi khi lấy số lượng sản phẩm");
            }
        }

        const countTotalImportQuantity = async () => {
            try {
                const res = await countTotalImportQuantityAPI();
                setTotalImportQuantity(res.data);
            } catch (error) {
                message.error("Lỗi khi lấy số lượng sản phẩm");
            }
        }

        const countTotalExportQuantity = async () => {
            try {
                const res = await countTotalExportQuantityAPI();
                setTotalExportQuantity(res.data);
            } catch (error) {
                message.error("Lỗi khi lấy số lượng sản phẩm");
            }
        }

        countProducts();
        countStock();
        countTotalImportQuantity();
        countTotalExportQuantity();
    }, [])

    return (
        <div style={{ background: '#fff', padding: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
            {/* Tổng quan tình trạng kho */}
            <Title level={4} style={{ marginBottom: '20px' }}>Tổng Quan Tình Trạng Kho ({currentMonthYear})</Title>
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
                                        // prefix={card.value > 0 && (card.title.includes('nhập') || card.title.includes('tồn')) ? <ArrowUpOutlined /> : (card.title.includes('xuất') ? <ArrowDownOutlined /> : null)}
                                        suffix={card.suffix}
                                    />
                                )}
                            </Card>
                        </Tooltip>
                    </Col>
                ))}
            </Row>

            {/* Biểu đồ biến động hàng hóa */}
            <Title level={4} style={{ marginTop: '32px', marginBottom: '20px' }}>Biểu Đồ Biến Động Hàng Hóa ({currentMonthYear})</Title>
            <Card title="Biến động tồn kho trong tháng" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Thay thế bằng thư viện biểu đồ thực tế */}
                {renderChartPlaceholder()}
                <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginTop: '10px' }}>
                    Trục X: Ngày trong tháng, Trục Y: Tổng số lượng tồn kho.
                </Text>
            </Card>

            {/* Danh sách các tác vụ */}
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
    )
}

export default DashboardPage;