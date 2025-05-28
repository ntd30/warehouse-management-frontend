import { useState, useMemo, useContext } from 'react';
import {
    Form,
    Space,
    Tabs,
} from 'antd';
import {
    PlusOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { AuthContext } from '../components/context/auth.context';
import { StockInHistory } from '../components/stockin/stock.in.history';
import StockIn from '../components/stockin/stock.in';

export const StockInScreen = () => {
    const [form] = Form.useForm();
    const [itemForm] = Form.useForm();
    const [addedItems, setAddedItems] = useState([]);
    const [fileList, setFileList] = useState([]);
    const { user } = useContext(AuthContext);

    const tabItems = useMemo(
        () => [
            {
                label: <Space><PlusOutlined />Nhập Kho</Space>,
                key: '1',
                children: (
                    <StockIn
                        form={form}
                        itemForm={itemForm}
                        addedItems={addedItems}
                        setAddedItems={setAddedItems}
                        fileList={fileList}
                        setFileList={setFileList}
                        user={user}
                    />
                ),
            },
            {
                label: <Space><HistoryOutlined />Lịch Sử Nhập Kho</Space>,
                key: '2',
                children: <StockInHistory />,
            },
        ],
        [form, itemForm, addedItems, fileList, user]
    );

    return <Tabs defaultActiveKey="1" type="card" items={tabItems} />;
};