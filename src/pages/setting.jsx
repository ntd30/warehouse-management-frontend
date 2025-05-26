import { useState } from 'react';
import {
    Row,
    Col,
    Card,
    Form,
    InputNumber,
    Button,
    Table,
    Space,
    Typography,
    message,
    Select,
} from 'antd';
import {
    SaveOutlined,
    BellOutlined,
    SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Paragraph } = Typography;

// --- Dữ liệu mẫu ---
const mockProductsForMinStock = [
    { key: 'SP001', productCode: 'SP001', productName: 'Sản phẩm Alpha', currentMinStock: 10, unit: 'Cái' },
    { key: 'SP002', productCode: 'SP002', productName: 'Sản phẩm Beta', currentMinStock: 5, unit: 'Hộp' },
    { key: 'SP003', productCode: 'SP003', productName: 'Sản phẩm Gamma', currentMinStock: 20, unit: 'Thùng' },
];

const initialUsers = [
    { id: 'user1', username: 'admin', fullName: 'Quản Trị Viên Chính', email: 'admin@example.com', roleId: 'role_admin', isActive: true },
    { id: 'user2', username: 'nvkho01', fullName: 'Nhân Viên Kho A', email: 'nvkho01@example.com', roleId: 'role_staff', isActive: true },
    { id: 'user3', username: 'viewer01', fullName: 'Người Xem Báo Cáo', email: 'viewer01@example.com', roleId: 'role_viewer', isActive: false },
];
// --- Kết thúc dữ liệu mẫu ---

const SettingsScreen = () => {
    // Inventory Limit State
    const [productsMinStock, setProductsMinStock] = useState(
        mockProductsForMinStock.map(p => ({ ...p, newMinStock: p.currentMinStock }))
    );

    // Alert Settings State
    const [alertSettingsForm] = Form.useForm();
    const [alertRecipients, setAlertRecipients] = useState([initialUsers[0].email]);

    // Inventory Limit Functions
    const handleMinStockChange = (value, productKey) => {
        setProductsMinStock(prev =>
            prev.map(p => (p.key === productKey ? { ...p, newMinStock: value === null ? 0 : value } : p))
        );
    };

    const handleUpdateMinStock = (productKey) => {
        const productToUpdate = productsMinStock.find(p => p.key === productKey);
        if (productToUpdate) {
            setProductsMinStock(prev =>
                prev.map(p => (p.key === productKey ? { ...p, currentMinStock: p.newMinStock } : p))
            );
            message.success(`Cập nhật mức tồn tối thiểu cho ${productToUpdate.productName} thành công!`);
        }
    };

    const handleSaveAllMinStockChanges = () => {
        const updatedList = productsMinStock.map(p => ({ ...p, currentMinStock: p.newMinStock }));
        setProductsMinStock(updatedList);
        message.success('Đã lưu tất cả thay đổi mức tồn kho tối thiểu!');
    };

    // Alert Settings Functions
    const onFinishAlertSettings = (values) => {
        setAlertRecipients(values.recipients);
        console.log('Lưu cài đặt cảnh báo:', values);
        message.success('Lưu cài đặt cảnh báo thành công!');
    };

    // Columns definitions
    const minStockColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', width: 250, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Mức Tồn Tối Thiểu Hiện Tại', dataIndex: 'currentMinStock', key: 'currentMinStock', align: 'right', width: 200 },
        {
            title: 'Mức Tồn Tối Thiểu Mới',
            dataIndex: 'newMinStock',
            key: 'newMinStock',
            width: 200,
            render: (text, record) => (
                <InputNumber
                    min={0}
                    value={record.newMinStock}
                    onChange={value => handleMinStockChange(value, record.key)}
                    style={{ width: '100px' }}
                />
            ),
        },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Button type="primary" onClick={() => handleUpdateMinStock(record.key)} icon={<SaveOutlined />}>
                    Cập nhật
                </Button>
            ),
        },
    ];

    return (
        <div>
            <Card title="Giới Hạn Tồn Kho Tối Thiểu" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                extra={<Button type="dashed" icon={<SaveOutlined />} onClick={handleSaveAllMinStockChanges}>Lưu Tất Cả Thay Đổi</Button>}
            >
                <Table
                    columns={minStockColumns}
                    dataSource={productsMinStock}
                    rowKey="key"
                    bordered
                    size="small"
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Card title="Cài Đặt Cảnh Báo Hết Hàng" bordered={false} style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                <Paragraph>
                    Hệ thống sẽ tự động gửi cảnh báo khi số lượng tồn kho của một mặt hàng giảm xuống dưới mức tồn kho tối thiểu đã thiết lập.
                    Chọn người dùng sẽ nhận được các cảnh báo này qua email.
                </Paragraph>
                <Form form={alertSettingsForm} layout="vertical" onFinish={onFinishAlertSettings} initialValues={{ recipients: alertRecipients }}>
                    <Row gutter={16}>
                        <Col xs={24} md={16}>
                            <Form.Item name="recipients" label="Người Nhận Cảnh Báo (Email)" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một người nhận!' }]}>
                                <Select
                                    mode="multiple"
                                    allowClear
                                    style={{ width: '100%' }}
                                    placeholder="Chọn email người nhận"
                                    options={initialUsers.filter(u => u.isActive && u.email).map(user => ({
                                        label: `${user.fullName} (${user.email})`,
                                        value: user.email,
                                    }))}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={8}>
                            <Form.Item label=" "> {/* For alignment */}
                                <Button type="primary" htmlType="submit" icon={<BellOutlined />}>
                                    Lưu Cài Đặt Cảnh Báo
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>
        </div>
    );
};

export default SettingsScreen;