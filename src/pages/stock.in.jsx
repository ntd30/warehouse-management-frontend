import { useState, useEffect } from 'react';
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
    Upload,
    Table,
    Space,
    Typography,
    message,
    Divider,
    Tooltip // Đã import Tooltip
} from 'antd';
import {
    PlusOutlined,
    BarcodeOutlined,
    DeleteOutlined,
    SaveOutlined,
    CloseCircleOutlined,
    // Các icon dưới đây không được sử dụng, có thể xóa nếu không có kế hoạch dùng
    // ShopOutlined,
    // EnvironmentOutlined,
    // AppstoreAddOutlined,
    // TagOutlined
} from '@ant-design/icons';
import moment from 'moment'; // QUAN TRỌNG: Đảm bảo bạn đã cài đặt thư viện moment: npm install moment (hoặc yarn add moment)

const { Title, Text } = Typography;
// Option không còn được sử dụng trực tiếp nếu dùng `options` prop cho Select

// --- Dữ liệu mẫu (trong ứng dụng thực tế sẽ lấy từ API) ---
const mockSuppliers = [
    { id: 'ncc1', name: 'Nhà Cung Cấp A' },
    { id: 'ncc2', name: 'Nhà Cung Cấp B' },
    { id: 'ncc3', name: 'Công Ty TNHH XYZ' },
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
    { id: 'SP001', name: 'Sản phẩm Alpha', unit: 'cai', defaultSupplier: 'ncc1', defaultLocation: 'vt1' },
    { id: 'SP002', name: 'Sản phẩm Beta', unit: 'hop', defaultSupplier: 'ncc2', defaultLocation: 'vt1' },
    { id: 'SP003', name: 'Sản phẩm Gamma', unit: 'thung', defaultSupplier: 'ncc1', defaultLocation: 'vt2' },
];
// --- Kết thúc dữ liệu mẫu ---

const StockInScreen = () => {
    const [form] = Form.useForm(); // Form chính cho phiếu nhập
    const [itemForm] = Form.useForm(); // Form để thêm từng mặt hàng
    const [addedItems, setAddedItems] = useState([]);
    const [fileList, setFileList] = useState([]);

    // State cho dữ liệu động của Select (cho phép thêm mới)
    const [products, setProducts] = useState(mockProducts);
    const [suppliers, setSuppliers] = useState(mockSuppliers);
    const [locations, setLocations] = useState(mockStorageLocations);
    const [units, setUnits] = useState(mockUnits);

    useEffect(() => {
        // Tạo mã phiếu nhập mặc định (ví dụ)
        form.setFieldsValue({
            voucherCode: `PN${moment().format('YYYYMMDDHHmmss')}`,
            dateIn: moment(),
        });
    }, [form]);

    const handleAddItem = (values) => {
        const selectedProduct = products.find(p => p.id === values.productCode);
        const newItem = {
            key: Date.now(), // Sử dụng timestamp làm key tạm thời
            ...values,
            // Lấy tên SP nếu có, nếu không thì hiển thị tên đã nhập hoặc "N/A"
            productName: selectedProduct ? selectedProduct.name : (values.productName || 'N/A'),
        };
        setAddedItems([...addedItems, newItem]);
        itemForm.resetFields(); // Reset form thêm mặt hàng
        message.success(`Đã thêm "${newItem.productName || newItem.productCode}" vào phiếu nhập!`);
    };

    const handleRemoveItem = (key) => {
        setAddedItems(addedItems.filter(item => item.key !== key));
        message.info('Đã xóa mặt hàng khỏi phiếu nhập.');
    };

    const handleProductCodeChange = (value) => {
        const product = products.find(p => p.id === value);
        if (product) {
            itemForm.setFieldsValue({
                productName: product.name, // Tự động điền tên sản phẩm
                unit: product.unit,
                supplier: product.defaultSupplier,
                storageLocation: product.defaultLocation,
            });
        } else {
            // Nếu không tìm thấy sản phẩm, không tự động xóa tên sản phẩm nếu người dùng đã nhập tay
            // itemForm.setFieldsValue({ productName: undefined }); 
        }
    };

    const handleScanBarcode = () => {
        // Giả lập quét mã vạch
        const scannedCode = `SP${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
        itemForm.setFieldsValue({ productCode: scannedCode });
        handleProductCodeChange(scannedCode); // Kích hoạt tìm kiếm sản phẩm
        message.success(`Đã quét mã: ${scannedCode}`);
    };

    const onFinishVoucher = (values) => {
        if (addedItems.length === 0) {
            message.error('Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập!');
            return;
        }
        const voucherData = {
            ...values,
            dateIn: values.dateIn ? values.dateIn.format('YYYY-MM-DD HH:mm:ss') : null,
            items: addedItems,
            attachments: fileList.map(f => ({ name: f.name, uid: f.uid, status: f.status, url: f.url || f.thumbUrl })),
        };
        console.log('Dữ liệu Phiếu Nhập:', voucherData);
        // TODO: Gửi dữ liệu lên server, cập nhật _inventory
        message.success('Đã lưu phiếu nhập thành công!');
        form.resetFields();
        itemForm.resetFields();
        setAddedItems([]);
        setFileList([]);
        // Tạo lại mã phiếu nhập mới
        form.setFieldsValue({
            voucherCode: `PN${moment().format('YYYYMMDDHHmmss')}`,
            dateIn: moment(),
        });
    };

    const uploadProps = {
        onRemove: file => {
            setFileList(prevFileList => {
                const index = prevFileList.indexOf(file);
                const newFileList = prevFileList.slice();
                newFileList.splice(index, 1);
                return newFileList;
            });
        },
        beforeUpload: file => {
            setFileList(prevFileList => [...prevFileList, file]);
            return false; // Ngăn chặn việc tự động upload, chỉ lưu vào state
        },
        fileList,
        multiple: true,
    };

    // Hàm xử lý khi thêm item mới vào Select
    const handleAddItemToSelect = (value, type, inputIdToClear) => {
        if (!value || value.trim() === "") {
            message.warn("Vui lòng nhập giá trị để thêm mới.");
            return;
        }
        // Giả lập việc backend sẽ xử lý việc lưu này
        message.info(`"${value}" sẽ được xem xét để thêm mới khi lưu phiếu. (Backend xử lý)`);

        // Tạo ID mới tạm thời cho client-side rendering
        const tempId = value.toLowerCase().replace(/\s+/g, '') + '_' + Date.now();
        const newItem = { id: tempId, name: value };

        let success = false;
        if (type === 'product') {
            setProducts(prev => [...prev, newItem]);
            // Tự động chọn item vừa thêm vào form
            itemForm.setFieldsValue({ productCode: newItem.id, productName: newItem.name });
            success = true;
        } else if (type === 'supplier') {
            setSuppliers(prev => [...prev, newItem]);
            itemForm.setFieldsValue({ supplier: newItem.id });
            success = true;
        } else if (type === 'location') {
            setLocations(prev => [...prev, newItem]);
            itemForm.setFieldsValue({ storageLocation: newItem.id });
            success = true;
        } else if (type === 'unit') {
            setUnits(prev => [...prev, newItem]);
            itemForm.setFieldsValue({ unit: newItem.id });
            success = true;
        }

        if (success && inputIdToClear) {
            const inputElement = document.getElementById(inputIdToClear);
            if (inputElement) {
                inputElement.value = ''; // Xóa nội dung input sau khi thêm
            }
        }
    };


    const columns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120, ellipsis: true, },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', ellipsis: true },
        { title: 'Số Lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' },
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
        <>
            {/* Form chính cho toàn bộ phiếu nhập */}
            <Form form={form} layout="vertical" onFinish={onFinishVoucher}>
                <Card title="Thông Tin Phiếu Nhập" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item name="voucherCode" label="Mã Phiếu Nhập">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item name="dateIn" label="Ngày Nhập" rules={[{ required: true, message: 'Vui lòng chọn ngày nhập!' }]}>
                                <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm:ss" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={24} md={8}>
                            <Form.Item name="notes" label="Ghi Chú">
                                <Input.TextArea rows={1} placeholder="Nhập ghi chú cho phiếu" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card title="Thêm Hàng Hóa Vào Phiếu Nhập" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                    {/* Form này dùng để quản lý các trường nhập liệu cho một mặt hàng.
              Thuộc tính `component={false}` ngăn Ant Design render ra thẻ <form> HTML lồng nhau.
              Hàm `onFinish` (tức là `handleAddItem`) sẽ được gọi khi `itemForm.submit()` được thực thi.
            */}
                    <Form form={itemForm} layout="vertical" onFinish={handleAddItem} component={false}>
                        <Row gutter={16} align="bottom">
                            <Col xs={24} sm={12} md={6} lg={5}>
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
                                        onSearch={(value) => { /* Có thể dùng để fetch động nếu danh sách lớn */ }}
                                        notFoundContent={itemForm.getFieldValue('productCode') && itemForm.getFieldValue('productCode').trim() !== '' ? (
                                            <Button type="link" onClick={() => handleAddItemToSelect(itemForm.getFieldValue('productCode'), 'product', 'newProductInput')}>
                                                Thêm mới {itemForm.getFieldValue('productCode')}?
                                            </Button>
                                        ) : null}
                                        options={products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }))}
                                        dropdownRender={menu => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Space style={{ padding: '0 8px 4px' }}>
                                                    <Input
                                                        placeholder="Nhập mã hàng mới"
                                                        id="newProductInput"
                                                        style={{ flex: 1 }}
                                                        onPressEnter={(e) => {
                                                            e.preventDefault();
                                                            handleAddItemToSelect(e.target.value, 'product', 'newProductInput');
                                                        }}
                                                    />
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                                        const val = document.getElementById('newProductInput').value;
                                                        handleAddItemToSelect(val, 'product', 'newProductInput');
                                                    }}>
                                                        Thêm
                                                    </Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={3} lg={2}> {/* Tăng md span cho nút quét mã */}
                                <Form.Item label=" " colon={false}>
                                    <Button icon={<BarcodeOutlined />} onClick={handleScanBarcode} block>Quét Mã</Button>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={24} md={7} lg={5}> {/* Giảm md span cho tên hàng */}
                                <Form.Item name="productName" label="Tên Hàng Hóa">
                                    <Input placeholder="Tên hàng tự điền hoặc nhập tay" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={4} lg={3}> {/* Điều chỉnh responsive cho số lượng */}
                                <Form.Item name="quantity" label="Số Lượng" rules={[{ required: true, message: 'Số lượng không được trống!' }]}>
                                    <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập SL" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={4} lg={3}> {/* Điều chỉnh responsive cho ĐVT */}
                                <Form.Item name="unit" label="ĐVT" rules={[{ required: true, message: 'ĐVT không được trống!' }]}>
                                    <Select placeholder="Chọn ĐVT" allowClear
                                        options={units.map(u => ({ value: u.id, label: u.name }))}
                                        dropdownRender={menu => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Space style={{ padding: '0 8px 4px' }}>
                                                    <Input placeholder="Nhập ĐVT mới" id="newUnitInput" style={{ flex: 1 }} onPressEnter={(e) => { e.preventDefault(); handleAddItemToSelect(e.target.value, 'unit', 'newUnitInput'); }} />
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                                        const val = document.getElementById('newUnitInput').value;
                                                        handleAddItemToSelect(val, 'unit', 'newUnitInput');
                                                    }}>Thêm</Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={6} lg={3}> {/* Điều chỉnh responsive cho NCC */}
                                <Form.Item name="supplier" label="Nhà Cung Cấp">
                                    <Select placeholder="Chọn NCC" allowClear
                                        options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                                        dropdownRender={menu => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Space style={{ padding: '0 8px 4px' }}>
                                                    <Input placeholder="Nhập NCC mới" id="newSupplierInput" style={{ flex: 1 }} onPressEnter={(e) => { e.preventDefault(); handleAddItemToSelect(e.target.value, 'supplier', 'newSupplierInput'); }} />
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                                        const val = document.getElementById('newSupplierInput').value;
                                                        handleAddItemToSelect(val, 'supplier', 'newSupplierInput');
                                                    }}>Thêm</Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={3}>
                                <Form.Item name="storageLocation" label="Vị Trí Lưu Trữ">
                                    <Select placeholder="Chọn vị trí" allowClear
                                        options={locations.map(l => ({ value: l.id, label: l.name }))}
                                        dropdownRender={menu => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: '8px 0' }} />
                                                <Space style={{ padding: '0 8px 4px' }}>
                                                    <Input placeholder="Nhập vị trí mới" id="newLocationInput" style={{ flex: 1 }} onPressEnter={(e) => { e.preventDefault(); handleAddItemToSelect(e.target.value, 'location', 'newLocationInput'); }} />
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                                        const val = document.getElementById('newLocationInput').value;
                                                        handleAddItemToSelect(val, 'location', 'newLocationInput');
                                                    }}>Thêm</Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={4} lg={2}> {/* Điều chỉnh responsive cho nút Thêm */}
                                <Form.Item label=" " colon={false}>
                                    {/* Nút này sẽ gọi itemForm.submit(), sau đó itemForm.onFinish (tức là handleAddItem) sẽ được thực thi */}
                                    <Button type="primary" onClick={() => itemForm.submit()} icon={<PlusOutlined />} block>
                                        Thêm
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>

                    <Divider />
                    <Title level={5} style={{ marginBottom: 16 }}>Danh Sách Hàng Hóa Trong Phiếu Nhập</Title>
                    <Table
                        columns={columns}
                        dataSource={addedItems}
                        pagination={addedItems.length > 5 ? { pageSize: 5, size: 'small' } : false} // Phân trang nếu nhiều hơn 5 item
                        bordered
                        size="small"
                        scroll={{ x: 'max-content' }} // Cho phép cuộn ngang trên màn hình nhỏ
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
                                    <Table.Summary.Cell index={0} colSpan={2}>Tổng cộng</Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="right">{totalQuantity}</Table.Summary.Cell>
                                    <Table.Summary.Cell index={3} colSpan={4}></Table.Summary.Cell>
                                </Table.Summary.Row>
                            );
                        }}
                    />
                </Card>

                <Card title="Đính Kèm Hóa Đơn / Chứng Từ" bordered={false} style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
                    <Upload {...uploadProps} listType="picture-card">
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Tải lên</div>
                        </div>
                    </Upload>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>Bạn có thể tải lên nhiều tệp. Các tệp sẽ được đính kèm khi lưu phiếu nhập.</Text>
                </Card>

                <Row justify="end" style={{ marginTop: 24 }}>
                    <Space>
                        <Button icon={<CloseCircleOutlined />} onClick={() => {
                            form.resetFields();
                            itemForm.resetFields();
                            setAddedItems([]);
                            setFileList([]);
                            form.setFieldsValue({
                                voucherCode: `PN${moment().format('YYYYMMDDHHmmss')}`,
                                dateIn: moment(),
                            });
                            message.info('Đã hủy thao tác nhập kho.');
                        }}>
                            Hủy Bỏ
                        </Button>
                        {/* Nút này submit Form chính (form) */}
                        <Button type="primary" icon={<SaveOutlined />} htmlType="submit" size="large">
                            Lưu Phiếu Nhập
                        </Button>
                    </Space>
                </Row>
            </Form>
        </>
    );
};

export default StockInScreen;
