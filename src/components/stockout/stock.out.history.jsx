import { EyeOutlined } from "@ant-design/icons";
import { Button, Card, Col, message, Modal, Row, Table, Tooltip, Typography } from "antd";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStockOutHistoryAPI } from "../../services/api.service";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Đăng ký font DejaVu Sans để hỗ trợ tiếng Việt
pdfMake.fonts = {
    DejaVuSans: {
        normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/DejaVuSans/DejaVuSans.ttf',
        bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/DejaVuSans/DejaVuSans-Bold.ttf',
        italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/DejaVuSans/DejaVuSans-Oblique.ttf',
        bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/DejaVuSans/DejaVuSans-BoldOblique.ttf',
    },
};

// Đăng ký font vào vfs
pdfMake.vfs = pdfFonts?.pdfMake?.vfs;

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

const StockOutHistory = () => {
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

    const handleExportPDF = useCallback(() => {
        if (!selectedRecord) return;

        const totalQuantity = selectedRecord.products.reduce((sum, p) => sum + (p.quantity || 0), 0);

        const documentDefinition = {
            content: [
                { text: 'PHIẾU XUẤT KHO', style: 'header', alignment: 'center' },
                { text: `Mã phiếu: ${selectedRecord.id}`, style: 'subheader' },
                { text: `Ngày xuất: ${moment(selectedRecord.dateOut).format('YYYY-MM-DD HH:mm:ss')}`, style: 'subheader' },
                { text: `Người nhận: ${selectedRecord.destination}`, style: 'subheader' },
                { text: `Lý do: ${selectedRecord.reason}`, style: 'subheader' },
                { text: '', margin: [0, 10] }, // Khoảng cách
                {
                    table: {
                        headerRows: 1,
                        widths: [100, '*', 80, 80],
                        body: [
                            [
                                { text: 'Mã Hàng', style: 'tableHeader' },
                                { text: 'Tên Hàng Hóa', style: 'tableHeader' },
                                { text: 'Số Lượng', style: 'tableHeader', alignment: 'right' },
                                { text: 'ĐVT', style: 'tableHeader' },
                            ],
                            ...selectedRecord.products.map((p) => [
                                p.productCode,
                                p.productName,
                                { text: p.quantity, alignment: 'right' },
                                mockUnits.find((u) => u.id === p.unit)?.name || p.unit,
                            ]),
                            [
                                { text: 'Tổng cộng', colSpan: 2, bold: true },
                                {},
                                { text: totalQuantity, alignment: 'right', bold: true },
                                {},
                            ],
                        ],
                    },
                    layout: 'lightHorizontalLines',
                },
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 20] },
                subheader: { fontSize: 12, margin: [0, 5, 0, 5] },
                tableHeader: { bold: true, fontSize: 12, fillColor: '#16A085', color: 'white' },
            },
            defaultStyle: {
                font: 'DejaVuSans',
            },
        };

        try {
            pdfMake.createPdf(documentDefinition).download(`PhieuXuatKho_${selectedRecord.id}.pdf`);
            message.success('Đã xuất file PDF thành công!');
        } catch (error) {
            message.error('Lỗi khi xuất file PDF.');
            console.error(error);
        }
    }, [selectedRecord]);

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
            { title: 'Mã Phiếu Xuất', dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
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
                footer={[
                    <Button key="export" type="primary" onClick={handleExportPDF}>
                        Xuất PDF
                    </Button>,
                    <Button key="cancel" onClick={() => setIsDetailModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
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

export default StockOutHistory;