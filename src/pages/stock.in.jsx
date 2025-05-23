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
    Upload,
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
    BarcodeOutlined,
    DeleteOutlined,
    SaveOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { fetchProductByCodeAPI, warehouse } from '../services/api.service';
import { AuthContext } from '../components/context/auth.context';

const { Title, Text } = Typography;

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
    { id: `SP004`, name: 'Sản phẩm Duy', unit: 'thung', defaultSupplier: 'ncc1', defaultLocation: 'vt2' },
];

const StockInScreen = () => {
    const [form] = Form.useForm();
    const [itemForm] = Form.useForm();
    const [addedItems, setAddedItems] = useState([]);
    const [fileList, setFileList] = useState([]);
    // const [products, setProducts] = useState(mockProducts);
    const [suppliers, setSuppliers] = useState(mockSuppliers);
    const [locations, setLocations] = useState(mockStorageLocations);
    const [units, setUnits] = useState(mockUnits);
    const [isScanning, setIsScanning] = useState(false);
    const scannerRef = useRef(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        form.setFieldsValue({
            voucherCode: `PN${moment().format('YYYYMMDDHHmmss')}`,
            dateIn: moment(),
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
                    console.warn(`QR Code scan error: ${errorMessage}`);
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
        // const selectedProduct = products.find(p => p.id === values.productCode);
        const newItem = {
            key: Date.now(),
            ...values,
            // productName: selectedProduct ? selectedProduct.name : (values.productName || 'N/A'),
        };
        setAddedItems([...addedItems, newItem]);
        itemForm.resetFields();
        message.success(`Đã thêm "${newItem.productName || newItem.productCode}" vào phiếu nhập!`);
    };

    const handleRemoveItem = (key) => {
        setAddedItems(addedItems.filter(item => item.key !== key));
        message.info('Đã xóa mặt hàng khỏi phiếu nhập.');
    };

    const handleProductCodeChange = async (event) => {
        // const product = products.find(p => p.id === value);
        const product = await fetchProductByCodeAPI(event?.target?.value ? event?.target?.value : event);
        console.log("product from backend", product)
        if (product.data) {
            itemForm.setFieldsValue({
                productName: product.data.productName,
                unit: product.data.unit,
                supplierName: product.data.supplierName,
                locationName: product.data.locationName,
            });
        }
    };

    const handleScanBarcode = () => {
        setIsScanning(true);
    };

    const onFinishVoucher = async (values) => {
        if (addedItems.length === 0) {
            message.error('Vui lòng thêm ít nhất một mặt hàng vào phiếu nhập!');
            return;
        }
        const voucherData = {
            username: user.username,
            note: values.notes || "Nhập hàng",
            products: addedItems.map(item => ({
                productCode: item.productCode,
                productName: item.productName,
                quantity: item.quantity,
                unit: item.unit,
                supplierName: item.supplierName, // Map 'supplier' to 'supplierName'
                locationName: item.locationName, // Map 'storageLocation' to 'locationName'
                unitPrice: item.unitPrice || 0 // Thêm unitPrice, mặc định là 0 nếu không có
            }))
        };

        const formData = new FormData();
        formData.append('data', JSON.stringify(voucherData));
        fileList.forEach(file => {
            formData.append('invoiceFile', file.originFileObj || file);
        });

        const res = await warehouse(formData);

        if (res) {
            message.success('Đã lưu phiếu nhập thành công!');
            form.resetFields();
            itemForm.resetFields();
            setAddedItems([]);
            setFileList([]);
            form.setFieldsValue({
                voucherCode: `PN${moment().format('YYYYMMDDHHmmss')}`,
                dateIn: moment(),
            });
        } else {
            message.error('Lỗi khi lưu phiếu nhập: ' + res);
        }
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
            return false;
        },
        fileList,
        multiple: true,
    };

    // const handleAddItemToSelect = (value, type, inputIdToClear) => {
    //     if (!value || value.trim() === "") {
    //         message.warn("Vui lòng nhập giá trị để thêm mới.");
    //         return;
    //     }
    //     message.info(`"${value}" sẽ được xem xét để thêm mới khi lưu phiếu. (Backend xử lý)`);
    //     const tempId = value.toLowerCase().replace(/\s+/g, '') + '_' + Date.now();
    //     const newItem = { id: tempId, name: value };

    //     let success = false;
    //     if (type === 'product') {
    //         setProducts(prev => [...prev, newItem]);
    //         itemForm.setFieldsValue({ productCode: newItem.id, productName: newItem.name });
    //         success = true;
    //     } else if (type === 'supplier') {
    //         setSuppliers(prev => [...prev, newItem]);
    //         itemForm.setFieldsValue({ supplier: newItem.id });
    //         success = true;
    //     } else if (type === 'location') {
    //         setLocations(prev => [...prev, newItem]);
    //         itemForm.setFieldsValue({ storageLocation: newItem.id });
    //         success = true;
    //     } else if (type === 'unit') {
    //         setUnits(prev => [...prev, newItem]);
    //         itemForm.setFieldsValue({ unit: newItem.id });
    //         success = true;
    //     }

    //     if (success && inputIdToClear) {
    //         const inputElement = document.getElementById(inputIdToClear);
    //         if (inputElement) {
    //             inputElement.value = '';
    //         }
    //     }
    // };

    const columns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120, ellipsis: true },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', ellipsis: true },
        { title: 'Số Lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' },
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
                                        // options={products.map(p => ({ value: p.id, label: `${p.id} - ${p.name}` }))}
                                        // dropdownRender={menu => (
                                        //     <>
                                        //         {menu}
                                        //         <Divider style={{ margin: '8px 0' }} />
                                        //         <Space style={{ padding: '0 8px 4px' }}>
                                        //             <Input
                                        //                 placeholder="Nhập mã hàng mới"
                                        //                 id="newProductInput"
                                        //                 style={{ flex: 1 }}
                                        //                 onPressEnter={(e) => {
                                        //                     e.preventDefault();
                                        //                     handleAddItemToSelect(e.target.value, 'product', 'newProductInput');
                                        //                 }}
                                        //             />
                                        //             <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                        //                 const val = document.getElementById('newProductInput').value;
                                        //                 handleAddItemToSelect(val, 'product', 'newProductInput');
                                        //             }}>
                                        //                 Thêm
                                        //             </Button>
                                        //         </Space>
                                        //     </>
                                        // )}
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
                                    <Input placeholder="Tên hàng tự điền hoặc nhập tay" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={4} lg={3}>
                                <Form.Item name="quantity" label="Số Lượng" rules={[{ required: true, message: 'Số lượng không được trống!' }]}>
                                    <InputNumber min={1} style={{ width: '100%' }} placeholder="Nhập SL" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={4} lg={3}>
                                <Form.Item name="unit" label="ĐVT" rules={[{ required: true, message: 'ĐVT không được trống!' }]}>
                                    <Select placeholder="Chọn ĐVT" allowClear
                                        options={units.map(u => ({ value: u.id, label: u.name }))}
                                        // dropdownRender={menu => (
                                        //     <>
                                        //         {menu}
                                        //         <Divider style={{ margin: '8px 0' }} />
                                        //         <Space style={{ padding: '0 8px 4px' }}>
                                        //             <Input placeholder="Nhập ĐVT mới" id="newUnitInput" style={{ flex: 1 }} onPressEnter={(e) => { e.preventDefault(); handleAddItemToSelect(e.target.value, 'unit', 'newUnitInput'); }} />
                                        //             <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                        //                 const val = document.getElementById('newUnitInput').value;
                                        //                 handleAddItemToSelect(val, 'unit', 'newUnitInput');
                                        //             }}>Thêm</Button>
                                        //         </Space>
                                        //     </>
                                        // )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={8} md={6} lg={3}>
                                <Form.Item name="supplierName" label="Nhà Cung Cấp">
                                    <Select placeholder="Chọn NCC" allowClear
                                        options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                                        // dropdownRender={menu => (
                                        //     <>
                                        //         {menu}
                                        //         <Divider style={{ margin: '8px 0' }} />
                                        //         <Space style={{ padding: '0 8px 4px' }}>
                                        //             <Input placeholder="Nhập NCC mới" id="newSupplierInput" style={{ flex: 1 }} onPressEnter={(e) => { e.preventDefault(); handleAddItemToSelect(e.target.value, 'supplier', 'newSupplierInput'); }} />
                                        //             <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                        //                 const val = document.getElementById('newSupplierInput').value;
                                        //                 handleAddItemToSelect(val, 'supplier', 'newSupplierInput');
                                        //             }}>Thêm</Button>
                                        //         </Space>
                                        //     </>
                                        // )}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={3}>
                                <Form.Item name="locationName" label="Vị Trí Lưu Trữ">
                                    <Select placeholder="Chọn vị trí" allowClear
                                        options={locations.map(l => ({ value: l.id, label: l.name }))}
                                        // dropdownRender={menu => (
                                        //     <>
                                        //         {menu}
                                        //         <Divider style={{ margin: '8px 0' }} />
                                        //         <Space style={{ padding: '0 8px 4px' }}>
                                        //             <Input placeholder="Nhập vị trí mới" id="newLocationInput" style={{ flex: 1 }} onPressEnter={(e) => { e.preventDefault(); handleAddItemToSelect(e.target.value, 'location', 'newLocationInput'); }} />
                                        //             <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                                        //                 const val = document.getElementById('newLocationInput').value;
                                        //                 handleAddItemToSelect(val, 'location', 'newLocationInput');
                                        //             }}>Thêm</Button>
                                        //         </Space>
                                        //     </>
                                        // )}
                                    />
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
                    <Title level={5} style={{ marginBottom: 16 }}>Danh Sách Hàng Hóa Trong Phiếu Nhập</Title>
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