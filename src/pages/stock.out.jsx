import { useState, useEffect, useRef, useContext } from 'react';
import {
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
    Tooltip,
    Modal,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    CloseCircleOutlined,
    BarcodeOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { fetchProductByCodeAPI, StockOutAPI } from '../services/api.service';
import { AuthContext } from '../components/context/auth.context';

const { Title } = Typography;

// --- Dữ liệu mẫu ---
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

const mockProducts = [
    { id: 'SP001', name: 'Sản phẩm Alpha', unit: 'cai', supplier: 'ncc1', storageLocation: 'vt1', currentStock: 100 },
    { id: 'SP002', name: 'Sản phẩm Beta', unit: 'hop', supplier: 'ncc2', storageLocation: 'vt1', currentStock: 50 },
    { id: 'SP003', name: 'Sản phẩm Gamma', unit: 'thung', supplier: 'ncc1', storageLocation: 'vt2', currentStock: 200 },
    { id: 'SP004', name: 'Sản phẩm Delta', unit: 'kg', supplier: 'ncc2', storageLocation: 'vt3', currentStock: 0 },
];

const mockCustomers = [
    { id: 'kh1', name: 'Khách hàng X' },
    { id: 'kh2', name: 'Công ty Y' },
    { id: 'bp1', name: 'Bộ phận Marketing' },
];
// --- Kết thúc dữ liệu mẫu ---

const StockOutScreen = () => {
    const [form] = Form.useForm();
    const [itemForm] = Form.useForm();
    const [addedItems, setAddedItems] = useState([]);
    const [products, setProducts] = useState(mockProducts);
    const [suppliers, setSuppliers] = useState(mockSuppliers);
    const [locations, setLocations] = useState(mockStorageLocations);
    const [units, setUnits] = useState(mockUnits);
    const [customers, setCustomers] = useState(mockCustomers);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        form.setFieldsValue({
            voucherCode: `PX${moment().format('YYYYMMDDHHmmss')}`,
            dateOut: moment(),
        });
    }, [form]);

    useEffect(() => {
        if (isScanning) {
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
            };

            scannerRef.current = new Html5QrcodeScanner("reader", config, false);

            scannerRef.current.render(
                (decodedText) => {
                    itemForm.setFieldsValue({ productCode: decodedText });
                    handleProductCodeChange(decodedText);
                    setIsScanning(false);
                    message.success(`Đã quét mã: ${decodedText}`);
                    scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
                },
                (errorMessage) => {
                    console.warning(`QR Code scan error: ${errorMessage}`);
                }
            );
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
            }
        };
    }, [isScanning, itemForm]);

    const handleAddItem = (values) => {
        if (!values.productCode) {
            message.error('Không tìm thấy thông tin sản phẩm!');
            return;
        }

        if (values.quantity > values.currentStockDisplay) {
            message.warning(`Số lượng xuất (${values.quantity}) vượt quá số lượng tồn kho (${values.currentStockDisplay}) của sản phẩm "${values.productName}"!`);
            itemForm.setFields([{ name: 'quantity', errors: [`Tồn kho: ${values.currentStockDisplay}`] }]);
            return;
        }
        if (values.quantity <= 0) {
            message.warning('Số lượng xuất phải lớn hơn 0.');
            itemForm.setFields([{ name: 'quantity', errors: ['Phải > 0'] }]);
            return;
        }

        const newItem = {
            key: Date.now(),
            ...values,
        };
        setAddedItems([...addedItems, newItem]);
        itemForm.resetFields(['productCode', 'productName', 'currentStockDisplay', 'quantity', 'unit', 'supplierName', 'locationName']);
        message.success(`Đã thêm "${newItem.productName}" vào phiếu xuất!`);
    };

    const handleRemoveItem = (key) => {
        setAddedItems(addedItems.filter(item => item.key !== key));
        message.info('Đã xóa mặt hàng khỏi phiếu xuất.');
    };

    const handleProductCodeChange = async (event) => {
        const res = await fetchProductByCodeAPI(event?.target?.value ? event?.target?.value : event)
        const product = res.data
        if (product) {
            itemForm.setFieldsValue({
                productName: product.productName,
                unit: product.unit,
                supplierName: product.supplierName,
                locationName: product.locationName,
                // Backend trả về currentStock là quantity
                currentStockDisplay: product.quantity,
                quantity: product.quantity > 0 ? 1 : 0,
            });
            if (product.quantity === 0) {
                message.warning(`Sản phẩm "${product.productName}" đã hết hàng!`);
                itemForm.setFields([{ name: 'quantity', errors: ['Hết hàng'] }]);
            } else {
                itemForm.setFields([{ name: 'quantity', errors: [] }]);
            }
        } else {
            itemForm.resetFields(['productName', 'currentStockDisplay', 'quantity', 'unit', 'supplier', 'storageLocation']);
        }
    };

    const handleScanBarcode = () => {
        setIsScanning(true);
    };

    const onFinishVoucher = async (values) => {
        if (addedItems.length === 0) {
            message.error('Vui lòng thêm ít nhất một mặt hàng vào phiếu xuất!');
            return;
        }
        const voucherData = {
            username: user.username,
            destination: values.destination,
            note: values.reason || "Xuất hàng",
            products: addedItems.map(item => ({
                productCode: item.productCode,
                quantity: item.quantity,
            }))
        };

        const res = await StockOutAPI(voucherData);

        if (res) {
            message.success('Đã lưu phiếu xuất thành công!');
            form.resetFields();
            itemForm.resetFields();
            setAddedItems([]);
            form.setFieldsValue({
                voucherCode: `PN${moment().format('YYYYMMDDHHmmss')}`,
                dateIn: moment(),
            });
        } else {
            message.error('Lỗi khi lưu phiếu nhập: ' + res);
        }
    };

    const columns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120, ellipsis: true },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', ellipsis: true },
        { title: 'SL Xuất', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' },
        { title: 'Tồn Kho (Lúc Thêm)', dataIndex: 'currentStockDisplay', key: 'currentStockDisplay', width: 150, align: 'right' },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80, render: (text) => units.find(u => u.id === text)?.name || text },
        { title: 'Nhà Cung Cấp', dataIndex: 'supplierName', key: 'supplierName', ellipsis: true, render: (text) => suppliers.find(s => s.id === text)?.name || text },
        { title: 'Vị Trí Lưu Trữ', dataIndex: 'locationName', key: 'locationName', ellipsis: true, render: (text) => locations.find(l => l.id === text)?.name || text },
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
        <>
            <Modal
                open={isScanning}
                title="Quét Mã Vạch / QR"
                onCancel={() => {
                    setIsScanning(false);
                    if (scannerRef.current) {
                        scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
                    }
                }}
                footer={null}
                centered
                bodyStyle={{ padding: 0 }}
            >
                <div id="reader" style={{ width: '100%', height: '400px' }}></div>
            </Modal>

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
                            <Form.Item name="destination" label="Người nhận/Khách hàng">
                                <Input placeholder="Chọn người nhận/khách hàng" allowClear
                                    // options={customers.map(c => ({ value: c.id, label: c.name }))}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card title="Thêm Hàng Hóa Vào Phiếu Xuất" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                    <Form form={itemForm} layout="vertical" onFinish={handleAddItem} component={false}>
                        <Row gutter={16} align="bottom">
                            <Col xs={24} sm={12} md={6} lg={5}>
                                <Form.Item name="productCode" label="Mã Hàng" rules={[{ required: true, message: 'Mã hàng không được trống!' }]}>
                                    <Input
                                        // showSearch
                                        placeholder="Nhập hoặc quét mã hàng"
                                        allowClear
                                        // optionFilterProp="label"
                                        onChange={handleProductCodeChange}
                                    // filterOption={(input, option) =>
                                    //     (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    // }
                                    // options={products.map(p => ({ value: p.id, label: `${p.id} - ${p.name} (Tồn: ${p.currentStock})` }))}
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
                            <Col xs={24} sm={8} md={4} lg={3}>
                                <Form.Item name="unit" label="ĐVT">
                                    <Select disabled placeholder="ĐVT tự động điền" options={units.map(u => ({ value: u.id, label: u.name }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={6} lg={3}>
                                <Form.Item name="supplierName" label="Nhà Cung Cấp">
                                    <Select disabled placeholder="NCC tự động điền" options={suppliers.map(s => ({ value: s.id, label: s.name }))} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={3}>
                                <Form.Item name="locationName" label="Vị Trí Lưu Trữ">
                                    <Select disabled placeholder="Vị trí tự động điền" options={locations.map(l => ({ value: l.id, label: l.name }))} />
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
        </>
    );
};

export default StockOutScreen;