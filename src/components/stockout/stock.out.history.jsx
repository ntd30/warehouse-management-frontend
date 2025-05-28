import { EyeOutlined } from "@ant-design/icons";
import { Button, Card, Col, message, Modal, Row, Table, Tooltip, Typography } from "antd";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStockOutHistoryAPI } from "../../services/api.service";


const mockStockOutHistory = [
    {
        id: 'PX202505280001',
        dateOut: '2025-05-28 08:00:00',
        destination: 'Khách hàng X',
        reason: 'Bán hàng',
        products: [
            { productCode: 'SP001', productName: 'Sản phẩm Alpha', quantity: 10, unit: 'cai' },
            { productCode: 'SP002', productName: 'Sản phẩm Beta', quantity: 5, unit: 'hop' },
        ],
    },
    {
        id: 'PX202505270002',
        dateOut: '2025-05-27 14:30:00',
        destination: 'Công ty Y',
        reason: 'Chuyển kho nội bộ',
        products: [
            { productCode: 'SP003', productName: 'Sản phẩm Gamma', quantity: 20, unit: 'thung' },
        ],
    },
];

const mockUnits = [
    { id: 'Cái', name: 'Cái' },
    { id: 'Quả', name: 'Quả' },
    { id: 'Hộp', name: 'Hộp' },
    { id: 'Thùng', name: 'Thùng' },
    { id: 'Kg', name: 'Kg' },
];

export const StockOutHistory = () => {
    const [history, setHistory] = useState(mockStockOutHistory);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetchStockOutHistoryAPI();
            setHistory(res.data || mockStockOutHistory);
        } catch (error) {
            message.error('Lỗi khi tải lịch sử xuất kho.');
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleViewDetails = useCallback((record) => {
        setSelectedRecord(record);
        setIsDetailModalVisible(true);
    }, []);

    const detailColumns = useMemo(
        () => [
            { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
            { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', ellipsis: true },
            { title: 'Số Lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' },
            {
                title: 'ĐVT',
                dataIndex: 'unit',
                key: 'unit',
                width: 80,
                render: (text) => mockUnits.find((u) => u.id === text)?.name || text,
            },
        ],
        []
    );

    const historyColumns = useMemo(
        () => [
            {
                title: 'Mã Stuart: Mã Phiếu Xuất', dataIndex: 'id', key: 'id', width: 120, ellipsis: true
            },
            {
                title: 'Ngày Xuất',
                dataIndex: 'dateOut',
                key: 'dateOut',
                width: 150,
                render: (text) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
            },
            { title: 'Người Nhận', dataIndex: 'destination', key: 'destination', ellipsis: true },
            { title: 'Lý Do', dataIndex: 'reason', key: 'reason', ellipsis: true },
            {
                title: 'Thao Tác',
                key: 'action',
                width: 100,
                align: 'center',
                render: (_, record) => (
                    <Tooltip title="Xem chi tiết">
                        <Button icon={<EyeOutlined />} type="text" onClick={() => handleViewDetails(record)} />
                    </Tooltip>
                ),
            },
        ],
        [handleViewDetails]
    );

    return (
        <>
            <Card
                title="Lịch Sử Xuất Kho"
                bordered={false}
                style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
            >
                <Table
                    columns={historyColumns}
                    dataSource={history.map((item) => ({ ...item, key: item.id }))}
                    pagination={{ pageSize: 10, size: 'small' }}
                    bordered
                    size="small"
                    scroll={{ x: 'max-content' }}
                />
            </Card>

            <Modal
                title={`Chi Tiết Phiếu Xuất ${selectedRecord?.id}`}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedRecord && (
                    <>
                        <Row gutter={16} style={{ marginBottom: 16 }}>
                            <Col span={12}>
                                <Typography.Text strong>Mã Phiếu Xuất: </Typography.Text>
                                <Typography.Text>{selectedRecord.id}</Typography.Text>
                            </Col>
                            <Col span={12}>
                                <Typography.Text strong>Ngày Xuất: </Typography.Text>
                                <Typography.Text>{moment(selectedRecord.dateOut).format('YYYY-MM-DD HH:mm:ss')}</Typography.Text>
                            </Col>
                            <Col span={12}>
                                <Typography.Text strong>Người Nhận: </Typography.Text>
                                <Typography.Text>{selectedRecord.destination}</Typography.Text>
                            </Col>
                            <Col span={12}>
                                <Typography.Text strong>Lý Do: </Typography.Text>
                                <Typography.Text>{selectedRecord.reason}</Typography.Text>
                            </Col>
                        </Row>
                        <Table
                            columns={detailColumns}
                            dataSource={selectedRecord.products.map((p, index) => ({ ...p, key: index }))}
                            pagination={false}
                            bordered
                            size="small"
                            scroll={{ x: 'max-content' }}
                            summary={(pageData) => {
                                if (!pageData || pageData.length === 0) return null;
                                let totalQuantity = 0;
                                pageData.forEach(({ quantity }) => {
                                    if (typeof quantity === 'number') {
                                        totalQuantity += quantity;
                                    }
                                });
                                return (
                                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 'bold' }}>
                                        <Table.Summary.Cell index={0} colSpan={2}>
                                            Tổng cộng
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} align="right">
                                            {totalQuantity}
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} />
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