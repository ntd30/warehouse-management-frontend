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
    Tag,
    Modal,
    Tooltip,
} from 'antd';
import {
    DeleteOutlined,
    SaveOutlined,
    FileExcelOutlined,
    MailOutlined,
    BarcodeOutlined,
    CheckCircleTwoTone,
    CloseCircleTwoTone,
    SearchOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { fetchProductByCodeAPI, StockCheckAPI, fetchStockCheckByDate, exportStockCheckExcelByDate } from '../services/api.service';
import { AuthContext } from '../components/context/auth.context';

const { Text, Paragraph } = Typography;

// --- Dữ liệu mẫu ---
const mockProductsMaster = [
    { id: 'SP001', name: 'Sản phẩm Alpha', unit: 'Cái', storageLocation: 'Kệ A1-01', systemStock: 100 },
    { id: 'SP002', name: 'Sản phẩm Beta', unit: 'Hộp', storageLocation: 'Kệ A2-03', systemStock: 50 },
    { id: 'SP003', name: 'Sản phẩm Gamma', unit: 'Thùng', storageLocation: 'Kệ B1-05', systemStock: 200 },
    { id: 'SP004', name: 'Sản phẩm Delta', unit: 'Kg', storageLocation: 'Khu C', systemStock: 75 },
    { id: 'SP005', name: 'Sản phẩm Epsilon', unit: 'Lốc', storageLocation: 'Kệ A1-02', systemStock: 0 },
];

const mockStaff = [
    { id: 'staff1', name: 'Nguyễn Văn A' },
    { id: 'staff2', name: 'Trần Thị B' },
];
// --- Kết thúc dữ liệu mẫu ---

const StockCheckScreen = () => {
    const [form] = Form.useForm();
    const [itemScanForm] = Form.useForm();
    const [countSheetItems, setCountSheetItems] = useState([]);
    const [isReportModalVisible, setIsReportModalVisible] = useState(false);
    const [reportEmail, setReportEmail] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const productCodeInputRef = useRef(null);
    const scannerRef = useRef(null);
    const { user } = useContext(AuthContext);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        form.setFieldsValue({
            countSheetId: `PKK${moment().format('YYYYMMDDHHmmss')}`,
            countDate: moment(),
        });
        if (productCodeInputRef.current) {
            productCodeInputRef.current.focus();
        }
    }, [form]);

    useEffect(() => {
        if (isScanning) {
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
            };

            scannerRef.current = new Html5QrcodeScanner('reader', config, false);

            scannerRef.current.render(
                async (decodedText) => {
                    await scannerRef.current.clear();
                    itemScanForm.setFieldsValue({ productCode: decodedText });
                    handleAddOrFindProduct({ productCode: decodedText });
                    setIsScanning(false);
                    message.success(`Đã quét mã: ${decodedText}`);
                    scannerRef.current.clear().catch((error) => console.error('Failed to clear scanner', error));
                    if (productCodeInputRef.current) {
                        productCodeInputRef.current.focus();
                    }
                },
                (errorMessage) => {
                    console.warn(`QR Code scan error: ${errorMessage}`);
                }
            );
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => console.error('Failed to clear scanner', error));
            }
        };
    }, [isScanning, itemScanForm]);

    const handleGetStockCheckByDate = (dateMoment) => {
        if (!dateMoment) return;
        setSelectedDate(dateMoment);
        const date = dateMoment.format("YYYY-MM-DD");

        fetchStockCheckByDate(date)
            .then(res => {
                const mappedItems = res.data.map(item => ({
                    key: item.productCode,
                    productCode: item.productCode,
                    productName: item.productName,
                    storageLocation: item.locationName,
                    unit: item.unit,
                    systemStock: item.systemQuantity,
                    actualStock: item.actualQuantity,
                    difference: item.difference,
                    countStatus: item.status
                }));

                setCountSheetItems(mappedItems);
            })
            .catch(err => {
                console.error("Lỗi khi lấy kiểm kê:", err);
            });
    };


    const handleAddOrFindProduct = async (input) => {
        const productCode = input?.target?.value || input?.productCode || input;
        if (!productCode?.trim()) {
            message.error('Vui lòng nhập mã sản phẩm');
            return;
        }

        try {
            const product = await fetchProductByCodeAPI(productCode);
            if (!product.data?.productCode) {
                throw new Error('Sản phẩm không tồn tại');
            }
            const isExist = countSheetItems.some(item => item.productCode === product.data.productCode);
            if (isExist) {
                message.warning(`Sản phẩm "${product.data.productName}" đã có trong danh sách`);
                return;
            }
            const newItem = {
                key: product.data.productCode,
                productCode: product.data.productCode,
                productName: product.data.productName,
                storageLocation: product.data.locationName,
                unit: product.data.unit,
                systemStock: product.data.quantity,
                actualStock: undefined,
                difference: 0,
                countStatus: 'Chưa kiểm kê'
            };

            setCountSheetItems(prev => [...prev, newItem]);
            message.success(`Đã thêm "${product.data.productName}"`);
            itemScanForm.resetFields();
            productCodeInputRef.current?.focus();

        } catch (error) {
            console.error('Lỗi API:', error.response?.data || error.message);
            message.error(`Không tìm thấy sản phẩm "${productCode}"`);
        }
    };
    const handleActualStockChange = (value, productCode) => {
        setCountSheetItems((prevItems) =>
            prevItems.map((item) => {
                if (item.productCode === productCode) {
                    const actual = value === null || value === undefined ? 0 : value;
                    const system = item.systemStock;
                    const diff = actual - system;
                    let status = 'Chưa kiểm kê';
                    if (value !== undefined && value !== null) {
                        status = diff === 0 ? 'Trùng khớp' : 'Phát hiện sai lệch';
                    }
                    return { ...item, actualStock: actual, difference: diff, countStatus: status };
                }
                return item;
            })
        );
    };

    const handleRemoveItem = (productCode) => {
        setCountSheetItems((prevItems) => prevItems.filter((item) => item.productCode !== productCode));
        message.info(`Đã xóa sản phẩm "${productCode}" khỏi danh sách.`);
    };

    const handleCompleteCount = () => {
        const uncountedItems = countSheetItems.filter((item) => item.actualStock === undefined || item.actualStock === null);
        if (uncountedItems.length > 0) {
            Modal.confirm({
                title: 'Cảnh báo',
                content: `Còn ${uncountedItems.length} mặt hàng chưa nhập số lượng thực tế. Bạn có chắc muốn hoàn tất kiểm kê?`,
                okText: 'Hoàn tất',
                cancelText: 'Tiếp tục kiểm kê',
                onOk: () => {
                    finalizeCount();
                },
            });
        } else {
            finalizeCount();
        }
    };

    const username = user.username;
    const finalizeCount = async () => {
        const payload = countSheetItems.map(item => ({
            productCode: item.productCode,
            actualQuantity: item.actualStock,
        }));

        try {
            const response = await StockCheckAPI(username, payload);
            message.success('Đã hoàn tất kiểm kê kho!');
            console.log('Kết quả từ server:', response.data);
        } catch (error) {
            console.error('Lỗi khi gửi kiểm kê:', error);
            message.error('Có lỗi xảy ra khi hoàn tất kiểm kê.');
        }
    };

    const handleExportExcel = async () => {
        if (countSheetItems.length === 0) {
            message.warning('Không có dữ liệu để xuất báo cáo.');
            return;
        }

        if (!selectedDate) {
            message.warning('Vui lòng chọn ngày kiểm kê để xuất báo cáo.');
            return;
        }

        try {
            const date = selectedDate.format("YYYY-MM-DD");
            await exportStockCheckExcelByDate(date);
            message.success('Xuất báo cáo Excel thành công!');
        } catch (error) {
            message.error('Xuất báo cáo thất bại!');
            console.error('Lỗi khi xuất báo cáo Excel:', error);
        }
    };

    const showSendReportModal = () => {
        if (countSheetItems.length === 0) {
            message.warning('Không có dữ liệu để gửi báo cáo.');
            return;
        }
        setIsReportModalVisible(true);
    };

    const handleSendReportEmail = () => {
        if (!reportEmail) {
            message.error('Vui lòng nhập địa chỉ email người nhận!');
            return;
        }
        console.log(`Gửi báo cáo kiểm kê đến: ${reportEmail}`, countSheetItems);
        message.success(`Đã giả lập gửi báo cáo đến ${reportEmail} thành công!`);
        setIsReportModalVisible(false);
        setReportEmail('');
    };

    const handleScanBarcode = () => {
        setIsScanning(true);
    };

    const columns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Tên Hàng', dataIndex: 'productName', key: 'productName', width: 250, ellipsis: true, fixed: 'left' },
        { title: 'Vị Trí Lưu Trữ', dataIndex: 'storageLocation', key: 'storageLocation', width: 150, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Tồn Hệ Thống', dataIndex: 'systemStock', key: 'systemStock', align: 'right', width: 130 },
        {
            title: 'Tồn Thực Tế',
            dataIndex: 'actualStock',
            key: 'actualStock',
            align: 'right',
            width: 150,
            render: (text, record) => (
                <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    value={text}
                    onChange={(value) => handleActualStockChange(value, record.productCode)}
                    id={`actualStock_${record.productCode}`}
                    placeholder="Nhập SL"
                />
            ),
        },
        {
            title: 'Chênh Lệch',
            dataIndex: 'difference',
            key: 'difference',
            align: 'right',
            width: 120,
            render: (text, record) => {
                if (record.actualStock === undefined || record.actualStock === null) return <Text type="secondary">-</Text>;
                if (text > 0) return <Text type="success" strong>+{text}</Text>;
                if (text < 0) return <Text type="danger" strong>{text}</Text>;
                return <Text strong>{text}</Text>;
            },
        },
        {
            title: 'Trạng Thái Kiểm Kê',
            dataIndex: 'countStatus',
            key: 'countStatus',
            width: 180,
            align: 'center',
            render: (status, record) => {
                if (record.actualStock === undefined || record.actualStock === null)
                    return <Tag>Chưa nhập SL thực tế</Tag>;
                if (status === 'Trùng khớp')
                    return (
                        <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">
                            Trùng khớp
                        </Tag>
                    );
                if (status === 'Phát hiện sai lệch')
                    return (
                        <Tag icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />} color="error">
                            Phát hiện sai lệch
                        </Tag>
                    );
                return <Tag>{status}</Tag>;
            },
        },
        {
            title: 'Thao Tác',
            key: 'action',
            width: 100,
            align: 'center',
            fixed: 'right',
            render: (_, record) => (
                <Tooltip title="Xóa khỏi danh sách">
                    <Button
                        icon={<DeleteOutlined />}
                        type="text"
                        danger
                        onClick={() => handleRemoveItem(record.productCode)}
                    />
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
                        scannerRef.current.clear().catch((error) => console.error('Failed to clear scanner', error));
                    }
                }}
                footer={null}
                centered
                bodyStyle={{ padding: 0 }}
            >
                <div id="reader" style={{ width: '100%', height: '400px' }}></div>
            </Modal>

            <Form form={form} layout="vertical">
                <Card
                    title="Thông Tin Phiếu Kiểm Kê"
                    bordered={false}
                    style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                >
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="countSheetId" label="Mã Phiếu Kiểm Kê">
                                <Input readOnly />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item
                                name="countDate"
                                label="Ngày Kiểm Kê"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày kiểm kê!' }]}
                            >
                                <DatePicker
                                    style={{ width: "100%" }}
                                    format="YYYY-MM-DD"
                                    onChange={handleGetStockCheckByDate}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item
                                name="staffInCharge"
                                label="Nhân Viên Phụ Trách"
                                rules={[{ required: true, message: 'Vui lòng chọn nhân viên!' }]}
                            >
                                <Input readOnly defaultValue={user.fullName} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Form.Item name="notes" label="Ghi Chú">
                                <Input.TextArea rows={1} placeholder="Ghi chú cho đợt kiểm kê" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>
            </Form>

            <Card
                title="Quét/Nhập Sản Phẩm Cần Kiểm Kê"
                bordered={false}
                style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
            >
                <Form
                    form={itemScanForm}
                    onFinish={handleAddOrFindProduct}
                    layout="inline"
                >
                    <Form.Item
                        name="productCode"
                        label="Mã sản phẩm"
                        rules={[{ required: true, message: 'Nhập mã sản phẩm!' }]}
                        style={{ flexGrow: 1, marginRight: 8 }}
                    >
                        <Input
                            ref={productCodeInputRef}
                            prefix={<BarcodeOutlined />}
                            placeholder="Quét mã vạch hoặc nhập mã sản phẩm"
                            allowClear
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<SearchOutlined />}
                        >
                            Tìm / Thêm vào DS
                        </Button>
                    </Form.Item>
                    <Form.Item>
                        <Button icon={<BarcodeOutlined />} onClick={handleScanBarcode}>
                            Quét Mã
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Card
                title="Danh Sách Mặt Hàng Kiểm Kê"
                bordered={false}
                style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                extra={
                    <Space>
                        <Button
                            onClick={handleCompleteCount}
                            type="primary"
                            icon={<SaveOutlined />}
                            disabled={countSheetItems.length === 0}
                        >
                            Hoàn Tất Kiểm Kê
                        </Button>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={countSheetItems}
                    rowKey="key"
                    bordered
                    size="small"
                    scroll={{ x: 'max-content', y: 400 }}
                    pagination={
                        countSheetItems.length > 10
                            ? { pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'] }
                            : false
                    }
                    summary={(pageData) => {
                        if (!pageData || pageData.length === 0) return null;
                        let totalSystemStock = 0;
                        let totalActualStock = 0;
                        let totalDifference = 0;
                        let allCounted = true;

                        pageData.forEach(({ systemStock, actualStock, difference }) => {
                            totalSystemStock += systemStock || 0;
                            if (actualStock !== undefined && actualStock !== null) {
                                totalActualStock += actualStock;
                                totalDifference += difference;
                            } else {
                                allCounted = false;
                            }
                        });

                        return (
                            <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                <Table.Summary.Cell index={0} colSpan={5} align="right">
                                    Tổng cộng:
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="right">
                                    {totalSystemStock}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="right">
                                    {allCounted ? totalActualStock : <Text type="secondary">Chưa hoàn tất</Text>}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} align="right">
                                    {allCounted ? (totalDifference > 0 ? `+${totalDifference}` : totalDifference) : <Text type="secondary">-</Text>}
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4} colSpan={2}></Table.Summary.Cell>
                            </Table.Summary.Row>
                        );
                    }}
                />
            </Card>

            <Row justify="end" style={{ marginTop: 24 }}>
                <Space>
                    <Button
                        icon={<FileExcelOutlined />}
                        onClick={handleExportExcel}
                        disabled={countSheetItems.length === 0}
                    >
                        Tải Báo Cáo (Excel)
                    </Button>
                </Space>
            </Row>

            <Modal
                title="Gửi Báo Cáo Kiểm Kê Qua Email"
                open={isReportModalVisible}
                onOk={handleSendReportEmail}
                onCancel={() => setIsReportModalVisible(false)}
                okText="Gửi Báo Cáo"
                cancelText="Hủy"
            >
                <Form layout="vertical">
                    <Form.Item label="Địa chỉ Email Người Nhận" required>
                        <Input
                            type="email"
                            value={reportEmail}
                            onChange={(e) => setReportEmail(e.target.value)}
                            placeholder="Nhập địa chỉ email, ví dụ: quanly@example.com"
                        />
                    </Form.Item>
                    <Paragraph type="secondary">
                        Báo cáo kiểm kê (dạng Excel) sẽ được đính kèm và gửi đến địa chỉ email này.
                    </Paragraph>
                </Form>
            </Modal>
        </>
    );
};

export default StockCheckScreen;