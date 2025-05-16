import { Link, useRouteError } from "react-router-dom"
import { Result, Button } from "antd"

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <Result
      status="404"
      title="Oops!"
      subTitle={<i>{error.statusText || error.message}</i>}
      extra={<Button type="primary"><Link to="/">Trở về trang chủ</Link></Button>}
    />
  );
}
