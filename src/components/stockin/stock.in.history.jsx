import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Row,
    Col,
    Card,
    Form,
    Button,
    DatePicker,
    Upload,
    Table,
    Space,
    Typography,
    message,
    Divider,
    Tooltip,
    Modal,
    Tabs,
    Tag,
} from 'antd';
import {
    HistoryOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import { fetchStockInHistoryAPI } from '../../services/api.service';

export const StockInHistory = () => {
    const [historyForm] = Form.useForm();
    const [historyData, setHistoryData] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(
        async (values, page = 0, size = 10) => {
            setLoading(true);
            try {
                const { dateRange } = values;
                let startDate, endDate;
                if (dateRange && dateRange.length === 2) {
                    startDate = dateRange[0].startOf('day').toISOString();
                    endDate = dateRange[1].endOf('day').toISOString();
                } else {
                    startDate = moment().startOf('month').toISOString();
                    endDate = moment().endOf('day').toISOString();
                }

                const response = await fetchStockInHistoryAPI(startDate, endDate, page, size);
                if (!response.data || !Array.isArray(response.data.content)) {
                    throw new Error('Dữ liệu từ API không hợp lệ.');
                }

                const formattedData = response.data.content.map((item, index) => ({
                    key: (page * size + index).toString(),
                    voucherCode: item.code,
                    dateIn: moment(item.dateIn).format('DD/MM/YYYY HH:mm:ss'),
                    username: item.username,
                    note: item.note,
                    totalItems: item.products?.length || 0,
                    totalQuantity: item.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0,
                    products: item.products || [],
                }));

                setHistoryData(formattedData);
                setPagination({
                    page: response.data.page,
                    size: response.data.size,
                    totalElements: response.data.totalElements,
                    totalPages: response.data.totalPages,
                });
                message.success('Đã tải lịch sử nhập kho thành công.');
            } catch (error) {
                message.error(error.message || 'Lỗi khi tải lịch sử nhập kho.');
                setHistoryData([]);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // Initial fetch with default date range
    useEffect(() => {
        historyForm.setFieldsValue({
            dateRange: [moment().startOf('month'), moment()],
        });
        fetchHistory({ dateRange: [moment().startOf('month'), moment()] });
    }, [historyForm, fetchHistory]);

    const handleTableChange = useCallback(
        (pagination) => {
            const { current, pageSize } = pagination;
            historyForm.validateFields().then((values) => {
                fetchHistory(values, current - 1, pageSize);
            });
        },
        [historyForm, fetchHistory]
    );

    const columns = useMemo(
        () => [
            { title: 'Mã Phiếu Nhập', dataIndex: 'voucherCode', key: 'voucherCode', width: 150, fixed: 'left' },
            {
                title: 'Ngày Nhập',
                dataIndex: 'dateIn',
                key: 'dateIn',
                width: 180,
                render: (text) => <Text>{text}</Text>,
            },
            { title: 'Người Nhập', dataIndex: 'username', key: 'username', width: 150 },
            { title: 'Số Mặt Hàng', dataIndex: 'totalItems', key: 'totalItems', align: 'right', width: 120 },
            { title: 'Tổng Số Lượng', dataIndex: 'totalQuantity', key: 'totalQuantity', align: 'right', width: 120 },
            {
                title: 'Ghi Chú',
                dataIndex: 'note',
                key: 'note',
                ellipsis: true,
                render: (text) => <Text>{text || '-'}</Text>,
            },
            {
                title: 'Chi Tiết',
                key: 'details',
                width: 100,
                align: 'center',
                render: (_, record) => (
                    <Button
                        type="link"
                        onClick={() => {
                            Modal.info({
                                title: `Chi Tiết Phiếu Nhập ${record.voucherCode}`,
                                content: (
                                    <Table
                                        columns={[
                                            { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
                                            { title: 'Tên Hàng', dataIndex: 'productName', key: 'productName', ellipsis: true },
                                            { title: 'Số Lượng', dataIndex: 'quantity', key: 'quantity', align: 'right', width: 100 },
                                            { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
                                            {
                                                title: 'Nhà Cung Cấp',
                                                dataIndex: 'supplierName',
                                                key: 'supplierName',
                                                ellipsis: true,
                                            },
                                            {
                                                title: 'Vị Trí',
                                                dataIndex: 'locationName',
                                                key: 'locationName',
                                                ellipsis: true,
                                            },
                                        ]}
                                        dataSource={record.products.map((p, index) => ({ ...p, key: index }))}
                                        pagination={false}
                                        size="small"
                                        scroll={{ x: 'max-content' }}
                                    />
                                ),
                                width: 800,
                                okText: 'Đóng',
                            });
                        }}
                    >
                        Xem
                    </Button>
                ),
            },
        ],
        []
    );

    return (
        <>
            <Card
                title="Bộ Lọc Lịch Sử Nhập Kho"
                bordered={false}
                style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
            >
                <Form form={historyForm} layout="vertical" onFinish={fetchHistory}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12} md={10}>
                            <Form.Item
                                name="dateRange"
                                label="Khoảng Thời Gian"
                                rules={[{ required: true, message: 'Vui lòng chọn khoảng thời gian!' }]}
                            >
                                <DatePicker.RangePicker
                                    style={{ width: '100%' }}
                                    format="DD/MM/YYYY"
                                    disabledDate={(current) => current && current > moment().endOf('day')}
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                            <Form.Item label=" ">
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<HistoryOutlined />}
                                    loading={loading}
                                >
                                    Xem Lịch Sử
                                </Button>
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>
            <Card
                title="Kết Quả Lịch Sử Nhập Kho"
                bordered={false}
                style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
            >
                <Table
                    columns={columns}
                    dataSource={historyData}
                    loading={loading}
                    bordered
                    size="small"
                    scroll={{ x: 'max-content' }}
                    pagination={{
                        current: pagination.page + 1,
                        pageSize: pagination.size,
                        total: pagination.totalElements,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                        onChange: handleTableChange,
                    }}
                />
            </Card>
        </>
    );
};