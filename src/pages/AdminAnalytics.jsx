import React, { useEffect, useState } from "react";
import api from "../utils/api";


export default function AdminAnalytics() {
const [data, setData] = useState([]);


useEffect(() => {
api.get("/admin/analytics").then(res => setData(res.data));
}, []);


return (
<div>
<h2>Daily Gate Analytics</h2>
{data.map(d => (
<p key={d._id}>Gate {d._id}: {d.count} visitors</p>
))}
</div>
);
}