import { Tabs } from "antd";
import StockOut from "../components/stockout/stock.out";
import StockOutHistory from "../components/stockout/stock.out.history";

const StockOutScreen = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Tabs defaultActiveKey="1" type="card">
        <Tabs.TabPane tab="Xuất Kho" key="1">
          <StockOut />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Lịch Sử Xuất Kho" key="2">
          <StockOutHistory />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default StockOutScreen;