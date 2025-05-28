import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EyeOutlined, FileTextOutlined } from "@ant-design/icons";
import { Button, Card, Col, message, Modal, Row, Space, Table, Tooltip, Typography } from "antd";
import moment from "moment";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { AuthContext } from "../context/auth.context";
import { fetchFormOutDetailsAPI, fetchStockOutHistoryAPI } from "../../services/api.service";

const { Title, Text } = Typography;

// Đăng ký font Roboto
pdfMake.fonts = {
    Roboto: {
        normal: 'Roboto-Regular.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-MediumItalic.ttf',
    },
};
pdfMake.vfs = pdfFonts?.pdfMake?.vfs;

// Mock data
const mockStockOutHistory = [
    {
        id: 'PX-MOCK-001',
        code: 'PX202505280001',
        createdAt: '2025-05-28T08:00:00Z',
        destination: 'Khách hàng X',
        note: 'Bán hàng theo đơn hàng #DH123',
        products: [
            { productCode: 'SP001', productName: 'Sản phẩm Alpha', quantity: 10, unit: 'Cái' },
            { productCode: 'SP002', productName: 'Sản phẩm Beta', quantity: 5, unit: 'Hộp' },
        ],
    },
    {
        id: 'PX-MOCK-002',
        code: 'PX202505270002',
        createdAt: '2025-05-27T14:30:00Z',
        destination: 'Công ty Y',
        note: 'Chuyển kho nội bộ theo yêu cầu',
        products: [
            { productCode: 'SP003', productName: 'Sản phẩm Gamma', quantity: 20, unit: 'Thùng' },
        ],
    },
];

const mockUnits = [
    { id: 'Cái', name: 'Cái' },
    { id: 'Quả', name: 'Quả' },
    { id: 'Hộp', name: 'Hộp' },
    { id: 'Thùng', name: 'Thùng' },
    { id: 'Kg', name: 'Kg' },
    { id: 'Bộ', name: 'Bộ' },
];

const StockOutHistory = () => {
    const [history, setHistory] = useState([]);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [loadingTable, setLoadingTable] = useState(false);

    const { user } = useContext(AuthContext);

    const fetchHistory = useCallback(async (page, size) => {
        setLoadingTable(true);
        try {
            const res = await fetchStockOutHistoryAPI(page, size);
            if (res && res.data && res.data.content) {
                setHistory(res.data.content);
                setTotal(res.data.totalElements || 0);
            } else {
                console.warn("API fetch failed, using mock data.");
                setHistory(mockStockOutHistory.slice((page - 1) * size, page * size));
                setTotal(mockStockOutHistory.length);
            }
        } catch (error) {
            console.error('Lỗi khi tải lịch sử xuất kho:', error);
            message.error('Lỗi khi tải lịch sử xuất kho. Vui lòng thử lại.');
            setHistory(mockStockOutHistory.slice((page - 1) * size, page * size));
            setTotal(mockStockOutHistory.length);
        }
        setLoadingTable(false);
    }, []);

    useEffect(() => {
        fetchHistory(current, pageSize);
    }, [current, pageSize, fetchHistory]);

    const onChange = (pagination) => {
        if (+pagination.current !== +current) {
            setCurrent(+pagination.current);
        }
        if (+pagination.pageSize !== +pageSize) {
            setPageSize(+pagination.pageSize);
            if (current !== 1) setCurrent(1);
        }
    };

    const handleViewDetails = async (recordId) => {
        console.log('recordId:', recordId);
        setLoadingTable(true);
        try {
            const res = await fetchFormOutDetailsAPI(recordId);
            console.log('API response:', res);
            if (res && res.data) {
                setSelectedRecord(res.data);
                setIsDetailModalVisible(true);
            } else {
                const mockDetail = mockStockOutHistory.find(item => item.id === recordId || item.code === recordId);
                if (mockDetail) {
                    setSelectedRecord({ ...mockDetail, details: mockDetail.products });
                    setIsDetailModalVisible(true);
                } else {
                    message.error('Không thể tải chi tiết phiếu xuất.');
                }
            }
        } catch (error) {
            console.error("fetchFormOutDetailsAPI error:", error);
            message.error('Lỗi khi tải chi tiết phiếu xuất.');
            const mockDetail = mockStockOutHistory.find(item => item.id === recordId || item.code === recordId);
            if (mockDetail) {
                setSelectedRecord({ ...mockDetail, details: mockDetail.products });
                setIsDetailModalVisible(true);
            }
        }
        setLoadingTable(false);
    };

    const handleExportPDF = useCallback(() => {
        console.log('handleExportPDF called', { selectedRecord, user });
        if (!selectedRecord) {
            message.warn('Không có dữ liệu chi tiết để xuất PDF.');
            return;
        }
        const products = (selectedRecord?.details || selectedRecord?.products || []).filter(p =>
            p.productCode && p.productName && typeof p.quantity === 'number' && p.unit
        );
        if (!products || products.length === 0) {
            message.warn('Phiếu xuất không có sản phẩm nào để hiển thị trong PDF.');
            return;
        }

        console.log('pdfMake.fonts:', pdfMake.fonts);
        console.log('pdfMake.vfs:', pdfMake.vfs);

        const totalQuantity = products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
        const issuedBy = selectedRecord.currentUser?.fullName || user?.fullName || 'N/A';

        const documentDefinition = {
            content: [
                { text: 'PHIẾU XUẤT KHO', style: 'header', alignment: 'center' },
                { text: `Mã phiếu: ${selectedRecord.code || selectedRecord.id || 'N/A'}`, style: 'subheader', margin: [0, 10, 0, 0] },
                { text: `Ngày xuất: ${selectedRecord.createdAt ? moment(selectedRecord.createdAt).format('DD/MM/YYYY HH:mm:ss') : 'N/A'}`, style: 'subheader' },
                { text: `Người nhận: ${selectedRecord.destination || 'N/A'}`, style: 'subheader' },
                { text: `Lý do xuất: ${selectedRecord.note || selectedRecord.reason || 'N/A'}`, style: 'subheader' },
                { text: `Nhân viên xuất kho: ${issuedBy}`, style: 'subheader' },
                { text: '', margin: [0, 10, 0, 10] },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Mã SP', style: 'tableHeader' },
                                { text: 'Tên Sản Phẩm', style: 'tableHeader' },
                                { text: 'Số Lượng', style: 'tableHeader', alignment: 'right' },
                                { text: 'ĐVT', style: 'tableHeader', alignment: 'center' },
                            ],
                            ...products.map((p) => [
                                p.productCode || 'N/A',
                                p.productName || 'N/A',
                                { text: p.quantity !== undefined ? p.quantity.toString() : '0', alignment: 'right' },
                                mockUnits.find((u) => u.id === p.unit)?.name || p.unit || 'N/A',
                            ]),
                            [
                                { text: 'Tổng cộng số lượng', colSpan: 2, bold: true, style: 'tableCell', alignment: 'right', margin: [0, 5, 0, 5] },
                                {},
                                { text: totalQuantity.toString(), alignment: 'right', bold: true, style: 'tableCell', margin: [0, 5, 0, 5] },
                                { text: '', style: 'tableCell', margin: [0, 5, 0, 5] },
                            ],
                        ],
                    },
                    layout: {
                        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length || i === 1 || i === node.table.body.length - 1) ? 1 : 0.5,
                        vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0.5,
                        hLineColor: (i, node) => (i === 0 || i === node.table.body.length || i === 1) ? 'black' : 'gray',
                        vLineColor: (i, node) => (i === 0 || i === node.table.widths.length) ? 'black' : 'gray',
                        paddingLeft: () => 5,
                        paddingRight: () => 5,
                        paddingTop: () => 3,
                        paddingBottom: () => 3
                    }
                },
                { text: '', margin: [0, 30, 0, 0] },
                {
                    columns: [
                        { text: 'Người lập phiếu\n\n\n\n(Ký, họ tên)', style: 'signature', alignment: 'center' },
                        { text: 'Người nhận hàng\n\n\n\n(Ký, họ tên)', style: 'signature', alignment: 'center' },
                        { text: 'Thủ kho\n\n\n\n(Ký, họ tên)', style: 'signature', alignment: 'center' }
                    ]
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
                subheader: { fontSize: 11, margin: [0, 2, 0, 2] },
                tableHeader: { bold: true, fontSize: 10, fillColor: '#2c3e50', color: 'white', alignment: 'center' },
                tableCell: { fontSize: 9 },
                signature: { fontSize: 10, bold: true, margin: [0, 10, 0, 0] }
            },
            defaultStyle: { font: 'Roboto', fontSize: 10 },
            pageMargins: [40, 60, 40, 60]
        };

        try {
            console.log('Creating PDF with documentDefinition:', documentDefinition);
            pdfMake.createPdf(documentDefinition).download(`PhieuXuatKho_${selectedRecord.code || selectedRecord.id || 'unknown'}.pdf`);
            message.success('Đã xuất file PDF thành công!');
        } catch (error) {
            console.error("PDFMake error:", error);
            message.error('Lỗi khi xuất file PDF: ' + error.message);
        }
    }, [selectedRecord, user]);

    const detailColumns = useMemo(
        () => [
            { title: 'Mã SP', dataIndex: 'productCode', key: 'productCode', width: 120 },
            { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', ellipsis: true },
            { title: 'Số Lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right' },
            { title: 'Đơn vị tính', dataIndex: 'unit', key: 'unit', width: 100, align: 'right' },
        ],
        []
    );

    const historyColumns = useMemo(
        () => [
            { title: 'Mã Phiếu Xuất', dataIndex: 'code', key: 'code', width: 180 },
            {
                title: 'Nhân viên xuất kho',
                dataIndex: ['currentUser', 'fullName'],
                key: 'currentUserFullName',
                ellipsis: true,
                render: (_, record) => record.currentUser?.fullName || user?.fullName || 'N/A'
            },
            { title: 'Người Nhận', dataIndex: 'destination', key: 'destination', ellipsis: true },
            { title: 'Lý Do', dataIndex: 'note', key: 'note', ellipsis: true },
            {
                title: 'Ngày Xuất',
                dataIndex: 'createdAt',
                key: 'createdAt',
                width: 160,
                render: (text) => text ? moment(text).format('DD/MM/YYYY HH:mm:ss') : 'N/A',
            },
            {
                title: 'Thao Tác',
                key: 'action',
                width: 100,
                align: 'center',
                render: (_, record) => (
                    <Tooltip title="Xem chi tiết">
                        <Button icon={<EyeOutlined />} type="text" onClick={() => handleViewDetails(record.id)} />
                    </Tooltip>
                ),
            },
        ],
        [user]
    );

    return (
        <Card title="Lịch Sử Xuất Kho" bordered={false} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
            <Table
                dataSource={history}
                columns={historyColumns}
                rowKey="id"
                pagination={{
                    current: current,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showTotal: (totalRows, range) => (
                        <span>
                            {range[0]}-{range[1]} trên {totalRows} dòng
                        </span>
                    ),
                }}
                loading={loadingTable}
                onChange={onChange}
                scroll={{ x: 'max-content' }}
            />

            <Modal
                title={<Title level={4}>Chi Tiết Phiếu Xuất Kho - {selectedRecord?.code || selectedRecord?.id}</Title>}
                open={isDetailModalVisible}
                onCancel={() => setIsDetailModalVisible(false)}
                footer={[
                    <Button key="export" type="primary" onClick={handleExportPDF} icon={<FileTextOutlined />}>
                        Xuất PDF
                    </Button>,
                    <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
                width="70%"
                destroyOnClose
            >
                {selectedRecord && (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        <Row gutter={[16, 16]}>
                            <Col span={12}><Text strong>Mã Phiếu Xuất:</Text> {selectedRecord.code || selectedRecord.id}</Col>
                            <Col span={12}><Text strong>Ngày Xuất:</Text> {moment(selectedRecord.createdAt || selectedRecord.dateOut).format('DD/MM/YYYY HH:mm:ss')}</Col>
                            <Col span={12}><Text strong>Người Nhận:</Text> {selectedRecord.destination || 'N/A'}</Col>
                            <Col span={12}><Text strong>Lý Do Xuất:</Text> {selectedRecord.note || selectedRecord.reason || 'N/A'}</Col>
                            <Col span={24}><Text strong>Nhân viên xuất kho:</Text> {selectedRecord.currentUser?.fullName || user?.fullName || 'N/A'}</Col>
                        </Row>

                        <Title level={5} style={{ marginTop: 16 }}>Chi Tiết Sản Phẩm:</Title>
                        <Table
                            columns={detailColumns}
                            dataSource={selectedRecord?.details?.map((p, index) => ({ ...p, key: p.productCode || index })) || []}
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
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={0} colSpan={2} align="right">
                                            <Text strong>Tổng cộng số lượng:</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={2} align="right">
                                            <Text strong>{totalQuantity}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={3} />
                                    </Table.Summary.Row>
                                );
                            }}
                        />
                    </Space>
                )}
            </Modal>
        </Card>
    );
};

export default StockOutHistory;