import { useState, useEffect } from 'react';
import {
    Layout,
    Row,
    Col,
    Card,
    Form,
    Input,
    InputNumber,
    Button,
    Select,
    DatePicker,
    Table,
    Space,
    Typography,
    message,
    Divider,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    CloseCircleOutlined,
    BarcodeOutlined // Thêm icon quét mã vạch
} from '@ant-design/icons';
import moment from 'moment'; // QUAN TRỌNG: Đảm bảo bạn đã cài đặt thư viện moment: npm install moment (hoặc yarn add moment)

const { Title } = Typography;

// --- Dữ liệu mẫu (trong ứng dụng thực tế sẽ lấy từ API) ---
const mockSuppliers = [
    { id: 'ncc1', name: 'Nhà Cung Cấp A (cho SP Alpha)' },
    { id: 'ncc2', name: 'Nhà Cung Cấp B (cho SP Beta)' },
];

const mockStorageLocations = [
    { id: 'vt1', name: 'Kho Chính - Kệ A1' },
    { id: 'vt2', name: 'Kho Phụ - Khu B' },
    { id: 'vt3', name: 'Tầng 2 - Kệ C3' },
];

const mockUnits = [
    { id: 'cai', name: 'Cái' },
    { id: 'hop', name: 'Hộp' },
    { id: 'thung', name: 'Thùng' },
    { id: 'kg', name: 'Kg' },
];

// Thêm số lượng tồn kho vào mockProducts
const mockProducts = [
    { id: 'SP001', name: 'Sản phẩm Alpha', unit: 'cai', supplier: 'ncc1', storageLocation: 'vt1', currentStock: 100 },
    { id: 'SP002', name: 'Sản phẩm Beta', unit: 'hop', supplier: 'ncc2', storageLocation: 'vt1', currentStock: 50 },
    { id: 'SP003', name: 'Sản phẩm Gamma', unit: 'thung', supplier: 'ncc1', storageLocation: 'vt2', currentStock: 200 },
    { id: 'SP004', name: 'Sản phẩm Delta', unit: 'kg', supplier: 'ncc2', storageLocation: 'vt3', currentStock: 0 }, // Sản phẩm hết hàng
];

const mockCustomers = [
    { id: 'kh1', name: 'Khách hàng X' },
    { id: 'kh2', name: 'Công ty Y' },
    { id: 'bp1', name: 'Bộ phận Marketing' }
];
// --- Kết thúc dữ liệu mẫu ---

const StockOutScreen = () => {
    const [form] = Form.useForm(); // Form chính cho phiếu xuất
    const [itemForm] = Form.useForm(); // Form để thêm từng mặt hàng
    const [addedItems, setAddedItems] = useState([]);

    // State cho dữ liệu động của Select (cho phép thêm mới nếu cần)
    const [products, setProducts] = useState(mockProducts);
    const [suppliers, setSuppliers] = useState(mockSuppliers);
    const [locations, setLocations] = useState(mockStorageLocations);
    const [units, setUnits] = useState(mockUnits);
    const [customers, setCustomers] = useState(mockCustomers);


    useEffect(() => {
        // Tạo mã phiếu xuất mặc định
        form.setFieldsValue({
            voucherCode: `PX${moment().format('YYYYMMDDHHmmss')}`,
            dateOut: moment(),
        });
    }, [form]);

    const handleAddItem = (values) => {
        const product = products.find(p => p.id === values.productCode);
        if (!product) {
            message.error('Không tìm thấy thông tin sản phẩm!');
            return;
        }

        if (values.quantity > product.currentStock) {
            message.warn(`Số lượng xuất (${values.quantity}) vượt quá số lượng tồn kho (${product.currentStock}) của sản phẩm "${product.name}"!`);
            itemForm.setFields([{ name: 'quantity', errors: [`Tồn kho: ${product.currentStock}`] }]);
            return;
        }
        if (values.quantity <= 0) {
            message.warn('Số lượng xuất phải lớn hơn 0.');
            itemForm.setFields([{ name: 'quantity', errors: ['Phải > 0'] }]);
            return;
        }


        const newItem = {
            key: Date.now(),
            ...values,
            productName: product.name,
            currentStock: product.currentStock, // Lưu lại tồn kho lúc thêm để hiển thị
            // unit: product.unit, // Đã có từ form
            // supplier: product.supplier, // Đã có từ form
            // storageLocation: product.storageLocation // Đã có từ form
        };
        setAddedItems([...addedItems, newItem]);
        itemForm.resetFields(['productCode', 'productName', 'currentStockDisplay', 'quantity', 'unit', 'supplier', 'storageLocation']); // Reset các trường cần thiết
        message.success(`Đã thêm "${newItem.productName}" vào phiếu xuất!`);
    };

    const handleRemoveItem = (key) => {
        setAddedItems(addedItems.filter(item => item.key !== key));
        message.info('Đã xóa mặt hàng khỏi phiếu xuất.');
    };

    const handleProductCodeChange = (value) => {
        const product = products.find(p => p.id === value);
        if (product) {
            itemForm.setFieldsValue({
                productName: product.name,
                currentStockDisplay: product.currentStock, // Hiển thị tồn kho
                unit: product.unit,
                supplier: product.supplier, // Theo yêu cầu, hiển thị nhà cung cấp
                storageLocation: product.storageLocation,
                quantity: product.currentStock > 0 ? 1 : 0, // Gợi ý số lượng là 1 nếu còn hàng
            });
            if (product.currentStock === 0) {
                message.warning(`Sản phẩm "${product.name}" đã hết hàng!`);
                itemForm.setFields([{ name: 'quantity', errors: ['Hết hàng'] }]);
            } else {
                itemForm.setFields([{ name: 'quantity', errors: [] }]); // Xóa lỗi nếu có
            }
        } else {
            itemForm.resetFields(['productName', 'currentStockDisplay', 'quantity', 'unit', 'supplier', 'storageLocation']);
        }
    };

    const handleScanBarcode = () => {
        // Giả lập quét mã vạch
        const availableProducts = products.filter(p => p.currentStock > 0);
        if (availableProducts.length === 0) {
            message.warn("Không có sản phẩm nào còn hàng để quét.");
            return;
        }
        const randomIndex = Math.floor(Math.random() * availableProducts.length);
        const scannedCode = availableProducts[randomIndex].id;

        itemForm.setFieldsValue({ productCode: scannedCode });
        handleProductCodeChange(scannedCode);
        message.success(`Đã quét mã: ${scannedCode}`);
    };


    const onFinishVoucher = (values) => {
        if (addedItems.length === 0) {
            message.error('Vui lòng thêm ít nhất một mặt hàng vào phiếu xuất!');
            return;
        }
        const voucherData = {
            ...values,
            dateOut: values.dateOut ? values.dateOut.format('YYYY-MM-DD HH:mm:ss') : null,
            items: addedItems,
        };
        console.log('Dữ liệu Phiếu Xuất:', voucherData);
        // TODO: Gửi dữ liệu lên server, cập nhật _inventory
        // Khi server xử lý thành công, cần cập nhật lại mockProducts (hoặc fetch lại từ API)
        // Ví dụ cập nhật mockProducts:
        const updatedProducts = products.map(p => {
            const dispatchedItem = addedItems.find(item => item.productCode === p.id);
            if (dispatchedItem) {
                return { ...p, currentStock: p.currentStock - dispatchedItem.quantity };
            }
            return p;
        });
        setProducts(updatedProducts); // Cập nhật state sản phẩm (giả lập)

        message.success('Đã lưu phiếu xuất thành công!');
        form.resetFields();
        itemForm.resetFields();
        setAddedItems([]);
        // Tạo lại mã phiếu xuất mới
        form.setFieldsValue({
            voucherCode: `PX${moment().format('YYYYMMDDHHmmss')}`,
            dateOut: moment(),
        });
    };

    const columns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120, ellipsis: true },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', ellipsis: true },
        { title: 'SL Xuất', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' },
        { title: 'Tồn Kho (Lúc Thêm)', dataIndex: 'currentStock', key: 'currentStock', width: 150, align: 'right' },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80, render: (text) => units.find(u => u.id === text)?.name || text },
        { title: 'Nhà Cung Cấp', dataIndex: 'supplier', key: 'supplier', ellipsis: true, render: (text) => suppliers.find(s => s.id === text)?.name || text },
        { title: 'Vị Trí Lưu Trữ', dataIndex: 'storageLocation', key: 'storageLocation', ellipsis: true, render: (text) => locations.find(l => l.id === text)?.name || text },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Tooltip title="Xóa mặt hàng">
                    <Button icon={<DeleteOutlined />} type="text" danger onClick={() => handleRemoveItem(record.key)} />
                </Tooltip>
            ),
        },
    ];

    return (

        <Form form={form} layout="vertical" onFinish={onFinishVoucher}>
            <Card title="Thông Tin Phiếu Xuất" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                <Row gutter={16}>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item name="voucherCode" label="Mã Phiếu Xuất">
                            <Input readOnly />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item name="dateOut" label="Ngày Xuất" rules={[{ required: true, message: 'Vui lòng chọn ngày xuất!' }]}>
                            <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item name="reason" label="Lý Do Xuất">
                            <Input placeholder="VD: Bán hàng, Chuyển kho nội bộ,..." />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Form.Item name="customer" label="Người nhận/Khách hàng">
                            <Select placeholder="Chọn người nhận/khách hàng" allowClear
                                options={customers.map(c => ({ value: c.id, label: c.name }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Card>

            <Card title="Thêm Hàng Hóa Vào Phiếu Xuất" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                <Form form={itemForm} layout="vertical" onFinish={handleAddItem} component={false}>
                    <Row gutter={16} align="bottom">
                        <Col xs={24} sm={12} md={6} lg={4}>
                            <Form.Item name="productCode" label="Mã Hàng" rules={[{ required: true, message: 'Mã hàng không được trống!' }]}>
                                <Select
                                    showSearch
                                    placeholder="Nhập hoặc chọn mã hàng"
                                    allowClear
                                    optionFilterProp="label"
                                    onChange={handleProductCodeChange}
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    options={products.map(p => ({ value: p.id, label: `${p.id} - ${p.name} (Tồn: ${p.currentStock})` }))}
                                // Không cho thêm mới sản phẩm ở màn hình xuất kho
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={3} lg={2}>
                            <Form.Item label=" " colon={false}>
                                <Button icon={<BarcodeOutlined />} onClick={handleScanBarcode} block>Quét Mã</Button>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={24} md={7} lg={5}>
                            <Form.Item name="productName" label="Tên Hàng Hóa">
                                <Input readOnly placeholder="Tên hàng tự động điền" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8} md={4} lg={3}>
                            <Form.Item name="currentStockDisplay" label="Tồn Kho Hiện Tại">
                                <InputNumber style={{ width: '100%' }} readOnly />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8} md={4} lg={3}>
                            <Form.Item
                                name="quantity"
                                label="Số Lượng Xuất"
                                rules={[
                                    { required: true, message: 'SL xuất không được trống!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const productCode = getFieldValue('productCode');
                                            if (!value || !productCode) {
                                                return Promise.resolve();
                                            }
                                            const product = products.find(p => p.id === productCode);
                                            if (product && value > product.currentStock) {
                                                return Promise.reject(new Error(`Tối đa: ${product.currentStock}`));
                                            }
                                            if (value <= 0) {
                                                return Promise.reject(new Error('Phải > 0'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập SL" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={8} md={4} lg={2}>
                            <Form.Item name="unit" label="ĐVT">
                                <Select placeholder="ĐVT" disabled options={units.map(u => ({ value: u.id, label: u.name }))} />
                            </Form.Item>
                        </Col>
                        {/* Các trường Nhà cung cấp và Vị trí lưu trữ có thể ẩn đi nếu không cần thiết khi xuất kho */}
                        <Col xs={24} sm={12} md={6} lg={3} style={{ display: 'none' }}> {/* Ẩn tạm */}
                            <Form.Item name="supplier" label="Nhà Cung Cấp">
                                <Select placeholder="NCC" disabled options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6} lg={3} style={{ display: 'none' }}> {/* Ẩn tạm */}
                            <Form.Item name="storageLocation" label="Vị Trí Lưu Trữ">
                                <Select placeholder="Vị trí" disabled options={locations.map(l => ({ value: l.id, label: l.name }))} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={4} lg={2}>
                            <Form.Item label=" " colon={false}>
                                <Button type="primary" onClick={() => itemForm.submit()} icon={<PlusOutlined />} block>
                                    Thêm
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>

                <Divider />
                <Title level={5} style={{ marginBottom: 16 }}>Danh Sách Hàng Hóa Trong Phiếu Xuất</Title>
                <Table
                    columns={columns}
                    dataSource={addedItems}
                    pagination={addedItems.length > 5 ? { pageSize: 5, size: 'small' } : false}
                    bordered
                    size="small"
                    scroll={{ x: 'max-content' }}
                    summary={pageData => {
                        if (!pageData || pageData.length === 0) return null;
                        let totalQuantity = 0;
                        pageData.forEach(({ quantity }) => {
                            if (typeof quantity === 'number') {
                                totalQuantity += quantity;
                            }
                        });
                        return (
                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                <Table.Summary.Cell index={0} colSpan={2}>Tổng cộng xuất</Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="right">{totalQuantity}</Table.Summary.Cell>
                                <Table.Summary.Cell index={3} colSpan={5}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        );
                    }}
                />
            </Card>

            <Row justify="end" style={{ marginTop: 24 }}>
                <Space>
                    <Button icon={<CloseCircleOutlined />} onClick={() => {
                        form.resetFields();
                        itemForm.resetFields();
                        setAddedItems([]);
                        form.setFieldsValue({
                            voucherCode: `PX${moment().format('YYYYMMDDHHmmss')}`,
                            dateOut: moment(),
                        });
                        message.info('Đã hủy thao tác xuất kho.');
                    }}>
                        Hủy Bỏ
                    </Button>
                    <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large">
                        Lưu Phiếu Xuất
                    </Button>
                </Space>
            </Row>
        </Form>
    );
};

export default StockOutScreen;
