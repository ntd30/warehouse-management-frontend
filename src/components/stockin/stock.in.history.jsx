import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Row,
    Col,
    Card,
    Form,
    Button,
    DatePicker,
    Table,
    message,
    Modal,
    Typography,
    Tooltip,
    Descriptions,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import moment from 'moment';
import { fetchFormDetailsAPI, fetchStockInHistoryAPI } from '../../services/api.service';

const { Text } = Typography;

const StockInHistory = () => {
    const [historyForm] = Form.useForm();
    const [historyData, setHistoryData] = useState([]);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetchStockInHistoryAPI(current, pageSize);
            if (!response.data || !Array.isArray(response.data.content)) {
                throw new Error('Dữ liệu từ API không hợp lệ.');
            }

            setTotal(response.data.totalElements);

            const formattedData = response.data.content.map((item, index) => ({
                key: (current * pageSize + index).toString(),
                id: item.id, // Lưu id để gọi API chi tiết
                voucherCode: item.code,
                dateIn: moment(item.createdAt).format('DD/MM/YYYY HH:mm:ss'),
                username: item.username,
                note: item.note,
                totalItems: item.products?.length || 0,
                totalQuantity: item.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0,
                products: item.products || [],
            }));

            setHistoryData(formattedData);
            message.success('Đã tải lịch sử nhập kho thành công.');
        } catch (error) {
            message.error(error.message || 'Lỗi khi tải lịch sử nhập kho.');
            setHistoryData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [current, pageSize]);

    const onChange = (pagination) => {
        if (+pagination.current !== +current) {
            setCurrent(+pagination.current);
        }
        if (+pagination.pageSize !== +pageSize) {
            setPageSize(+pagination.pageSize);
        }
    };

    const handleViewDetail = async (id) => {
        let formDetails = await fetchFormDetailsAPI(id);
        if (formDetails) {
            formDetails = formDetails.data;
            setSelectedForm({
                id: formDetails.id,
                code: formDetails.code,
                note: formDetails.note,
                createdAt: moment(formDetails.createdAt).format('DD/MM/YYYY HH:mm:ss'),
                username: formDetails.username,
                fullName: formDetails.fullName,
                details: formDetails?.details?.map((detail, index) => ({
                    key: index,
                    unit: detail.unit,
                    productName: detail.productName,
                    supplierName: detail.supplierName,
                    quantity: detail.quantity,
                    unitPrice: detail.unitPrice,
                    locationName: detail.locationName,
                })),
            });
            setIsDetailModalVisible(true);
        }
    };

    const detailColumns = useMemo(
        () => [
            { title: 'Tên Sản Phẩm', dataIndex: 'productName', key: 'productName', width: 200 },
            {
                title: 'Số Lượng Nhập',
                dataIndex: 'quantity',
                key: 'quantity',
                width: 120,
                align: 'right',
            },
            { title: 'Đơn vị tính', dataIndex: 'unit', key: 'unit', width: 100 },
            { title: 'Nhà Cung Cấp', dataIndex: 'supplierName', key: 'supplierName', width: 150 },
            { title: 'Vị Trí Lưu Trữ', dataIndex: 'locationName', key: 'locationName', width: 150 },
            {
                title: 'Đơn Giá',
                dataIndex: 'unitPrice',
                key: 'unitPrice',
                width: 120,
                align: 'right',
                render: (price) => price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }),
            },
        ],
        []
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
                    <Tooltip title="Xem chi tiết">
                        <Button
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetail(record.id)}
                        />
                    </Tooltip>
                ),
            },
        ],
        []
    );

    return (
        <>
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
                        current: current,
                        pageSize: pageSize,
                        showSizeChanger: true,
                        total: total,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
                    onChange={onChange}
                />
            </Card>

            <Modal
                title={`Phiếu Nhập`}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width={"70%"}
            >
                {selectedForm && (
                    <>
                        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="Mã Phiếu Nhập">{selectedForm.code}</Descriptions.Item>
                            <Descriptions.Item label="Người Nhập">{selectedForm.username}</Descriptions.Item>
                            <Descriptions.Item label="Ghi Chú">{selectedForm.note || '-'}</Descriptions.Item>
                            <Descriptions.Item label="Ngày Tạo">{selectedForm.createdAt}</Descriptions.Item>
                        </Descriptions>
                        <Typography.Title level={4}>Chi Tiết Phiếu Nhập</Typography.Title>
                        <Table
                            columns={detailColumns}
                            dataSource={selectedForm?.details}
                            pagination={false}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            summary={(pageData) => {
                                let totalQuantity = 0;
                                let totalAmount = 0;
                                pageData.forEach(({ quantity, unitPrice }) => {
                                    totalQuantity += quantity || 0;
                                    totalAmount += (quantity || 0) * (unitPrice || 0);
                                });
                                return (
                                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                        <Table.Summary.Cell index={0}>Tổng cộng</Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} align="right">
                                            {totalQuantity}
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} />
                                        <Table.Summary.Cell index={3} />
                                        <Table.Summary.Cell index={4} />
                                        <Table.Summary.Cell index={5} align="right">
                                            {totalAmount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </>
                )}
            </Modal>
        </>
    );
};

export default StockInHistory;