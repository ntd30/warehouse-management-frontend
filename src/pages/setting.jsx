import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, message, Tabs, Modal, Popconfirm, Select, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, BellOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import axios from 'axios'; // Sử dụng axios để lấy danh sách sản phẩm nếu cần
import { fetchAllSettingsAPI, createSettingAPI, updateSettingAPI, deleteSettingAPI, fetchLowStockAlertEmailsAPI, fetchAllProductsAPI, updateMinStockAPI, updateBatchMinStockAPI } from '../services/api.service';

const { Paragraph } = Typography;

const SettingsScreen = () => {
    const [settings, setSettings] = useState([]);
    const [isSettingModalVisible, setIsSettingModalVisible] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [settingForm] = Form.useForm();
    const [loadingSettings, setLoadingSettings] = useState(false);

    const [productsMinStock, setProductsMinStock] = useState([]);
    const [loadingMinStock, setLoadingMinStock] = useState(false);

    const [alertSettingsForm] = Form.useForm();
    const [alertRecipients, setAlertRecipients] = useState([]);
    const [loadingAlertSettings, setLoadingAlertSettings] = useState(false);

    // Lấy dữ liệu từ backend với xử lý token
    useEffect(() => {
        const fetchSettings = async () => {
            setLoadingSettings(true);
            try {
                const response = await fetchAllSettingsAPI();
                setSettings(response.data || []);
            } catch (error) {
                message.error('Lỗi khi lấy danh sách thiết lập');
            } finally {
                setLoadingSettings(false);
            }
        };

        const fetchProductsMinStock = async () => {
            setLoadingMinStock(true);
            try {
                const response = await fetchAllProductsAPI();
                if (response.data && Array.isArray(response.data)) {
                    setProductsMinStock(response.data.map(p => ({
                        key: p.id,
                        productCode: p.productCode,
                        productName: p.name,
                        unit: p.unit,
                        currentMinStock: p.minStock || 0,
                        newMinStock: p.minStock || 0,
                    })));
                }
            } catch (error) {
                message.error('Lỗi khi lấy danh sách sản phẩm');
            } finally {
                setLoadingMinStock(false);
            }
        };

        const fetchAlertEmails = async () => {
            setLoadingAlertSettings(true);
            try {
                const response = await fetchLowStockAlertEmailsAPI();
                setAlertRecipients(response.data ? response.data.split(',') : []);
                alertSettingsForm.setFieldsValue({ recipients: response.data ? response.data.split(',') : [] });
            } catch (error) {
                message.error('Lỗi khi lấy danh sách email cảnh báo');
            } finally {
                setLoadingAlertSettings(false);
            }
        };

        fetchSettings();
        fetchProductsMinStock();
        fetchAlertEmails();
    }, []);

    const showSettingModal = (setting = null) => {
        setEditingSetting(setting);
        settingForm.setFieldsValue(setting || { key: '', value: '', description: '' });
        setIsSettingModalVisible(true);
    };

    const handleSettingModalOk = async () => {
        try {
            const values = await settingForm.validateFields();
            if (editingSetting) {
                await updateSettingAPI(values.key, values.value, values.description);
                setSettings(settings.map(s => (s.key === editingSetting.key ? { ...s, ...values } : s)));
                message.success('Cập nhật thiết lập thành công!');
            } else {
                await createSettingAPI(values.key, values.value, values.description);
                setSettings([...settings, values]);
                message.success('Thêm thiết lập thành công!');
            }
            setIsSettingModalVisible(false);
            settingForm.resetFields();
        } catch (error) {
            message.error('Lỗi khi lưu thiết lập: ' + (error.message || ''));
        }
    };

    const handleDeleteSetting = async (key) => {
        try {
            await deleteSettingAPI(key);
            setSettings(settings.filter(s => s.key !== key));
            message.success('Xóa thiết lập thành công!');
        } catch (error) {
            message.error('Lỗi khi xóa thiết lập: ' + (error.message || ''));
        }
    };

    const handleMinStockChange = (value, productKey) => {
        setProductsMinStock(prev =>
            prev.map(p => (p.key === productKey ? { ...p, newMinStock: value === null ? 0 : value } : p))
        );
    };

    const handleUpdateMinStock = async (productKey) => {
        try {
            const productToUpdate = productsMinStock.find(p => p.key === productKey);
            if (productToUpdate) {
                await updateMinStockAPI(productToUpdate.productCode, productToUpdate.newMinStock);
                setProductsMinStock(prev =>
                    prev.map(p => (p.key === productKey ? { ...p, currentMinStock: p.newMinStock } : p))
                );
                message.success(`Cập nhật mức tồn tối thiểu cho ${productToUpdate.productName} thành công!`);
            }
        } catch (error) {
            message.error('Lỗi khi cập nhật mức tồn tối thiểu: ' + (error.message || ''));
        }
    };

    const handleSaveAllMinStockChanges = async () => {
        try {
            const updates = productsMinStock.map(p => ({ productCode: p.productCode, minStock: p.newMinStock }));
            await updateBatchMinStockAPI(updates);
            setProductsMinStock(prev => prev.map(p => ({ ...p, currentMinStock: p.newMinStock })));
            message.success('Đã lưu tất cả thay đổi mức tồn kho tối thiểu!');
        } catch (error) {
            message.error('Lỗi khi lưu thay đổi mức tồn kho: ' + (error.message || ''));
        }
    };

    const onFinishAlertSettings = async (values) => {
        try {
            await updateSettingAPI(
                'low_stock_alert_emails',
                values.recipients.join(','),
                'Danh sách email nhận cảnh báo tồn kho thấp'
            );
            setAlertRecipients(values.recipients);
            message.success('Lưu cài đặt cảnh báo thành công!');
        } catch (error) {
            message.error('Lỗi khi lưu cài đặt cảnh báo: ' + (error.message || ''));
        }
    };

    const settingColumns = [
        { title: 'Key', dataIndex: 'key', key: 'key', width: 200 },
        { title: 'Giá trị', dataIndex: 'value', key: 'value', width: 200 },
        { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'center',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => showSettingModal(record)} />
                    <Popconfirm title="Bạn chắc chắn muốn xóa thiết lập này?" onConfirm={() => handleDeleteSetting(record.key)}>
                        <Button icon={<DeleteOutlined />} danger />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const minStockColumns = [
        { title: 'Mã Hàng', dataIndex: 'productCode', key: 'productCode', width: 120 },
        { title: 'Tên Hàng Hóa', dataIndex: 'productName', key: 'productName', width: 250, ellipsis: true },
        { title: 'ĐVT', dataIndex: 'unit', key: 'unit', width: 80 },
        { title: 'Mức Tồn Tối Thiểu Hiện Tại', dataIndex: 'currentMinStock', key: 'currentMinStock', align: 'right', width: 200 },
        {
            title: 'Mức Tồn Tối Thiểu Mới',
            dataIndex: 'newMinStock',
            key: 'newMinStock',
            width: 200,
            render: (text, record) => (
                <InputNumber
                    min={0}
                    value={record.newMinStock}
                    onChange={value => handleMinStockChange(value, record.key)}
                    style={{ width: '100px' }}
                />
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'center',
            render: (_, record) => (
                <Button type="primary" onClick={() => handleUpdateMinStock(record.key)} icon={<SaveOutlined />}>
                    Cập nhật
                </Button>
            ),
        },
    ];

    const settingTabItems = [
        {
            label: <Space><SafetyCertificateOutlined />Thiết lập Hệ thống</Space>,
            key: 'system_settings',
            children: (
                <Card
                    title="Quản lý Thiết lập Hệ thống"
                    bordered={false}
                    style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                    extra={<Button type="dashed" icon={<PlusOutlined />} onClick={() => showSettingModal()}>Thêm Thiết lập</Button>}
                >
                    <Table
                        columns={settingColumns}
                        dataSource={settings}
                        rowKey="key"
                        size="small"
                        pagination={{ pageSize: 5 }}
                        scroll={{ x: 'max-content' }}
                        loading={loadingSettings}
                    />
                </Card>
            ),
        },
        {
            label: <Space><SafetyCertificateOutlined />Thiết lập Quy tắc Nghiệp vụ</Space>,
            key: 'business_rules',
            children: (
                <>
                    <Card
                        title="Giới Hạn Tồn Kho Tối Thiểu"
                        bordered={false}
                        style={{ marginBottom: 24, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                        extra={<Button type="dashed" icon={<SaveOutlined />} onClick={handleSaveAllMinStockChanges}>Lưu Tất Cả Thay Đổi</Button>}
                    >
                        <Table
                            columns={minStockColumns}
                            dataSource={productsMinStock}
                            rowKey="key"
                            bordered
                            size="small"
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            loading={loadingMinStock}
                        />
                    </Card>
                    <Card
                        title="Cài Đặt Cảnh Báo Hết Hàng"
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}
                    >
                        <Paragraph>
                            Hệ thống sẽ tự động gửi cảnh báo khi số lượng tồn kho của một mặt hàng giảm xuống dưới mức tồn kho tối thiểu đã thiết lập.
                        </Paragraph>
                        <Form
                            form={alertSettingsForm}
                            layout="vertical"
                            onFinish={onFinishAlertSettings}
                            initialValues={{ recipients: alertRecipients }}
                        >
                            <Form.Item
                                name="recipients"
                                label="Người Nhận Cảnh Báo (Email)"
                                rules={[{ required: true, message: 'Vui lòng nhập ít nhất một email!' }]}
                            >
                                <Select
                                    mode="tags"
                                    allowClear
                                    style={{ width: '100%' }}
                                    placeholder="Nhập email người nhận"
                                    loading={loadingAlertSettings}
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" icon={<BellOutlined />}>
                                    Lưu Cài Đặt Cảnh Báo
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </>
            ),
        },
    ];

    return (
        <>
            <Tabs defaultActiveKey="system_settings" type="card" items={settingTabItems} />
            <Modal
                title={editingSetting ? "Sửa Thiết lập" : "Thêm Thiết lập Mới"}
                open={isSettingModalVisible}
                onOk={handleSettingModalOk}
                onCancel={() => { setIsSettingModalVisible(false); settingForm.resetFields(); }}
                okText={editingSetting ? "Cập nhật" : "Thêm mới"}
                cancelText="Hủy"
                destroyOnClose
            >
                <Form form={settingForm} layout="vertical">
                    <Form.Item
                        name="key"
                        label="Key"
                        rules={[{ required: true, message: 'Vui lòng nhập key!' }]}
                    >
                        <Input disabled={!!editingSetting} />
                    </Form.Item>
                    <Form.Item
                        name="value"
                        label="Giá trị"
                        rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SettingsScreen;