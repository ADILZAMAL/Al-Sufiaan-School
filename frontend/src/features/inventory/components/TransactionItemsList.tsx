import { TransactionItemType } from "../api";

const TransactionItemsList = ({ items }: { items: TransactionItemType[] }) => (
  <div className="space-y-2">
    {items.map((item, index) => (
      <div
        key={index}
        className="flex justify-between items-center py-2 px-4 bg-white rounded-lg border border-gray-200"
      >
        <span className="text-sm font-medium text-gray-900">{item.productName}</span>
        <span className="text-sm text-gray-500">
          {item.quantity} × ₹{item.unitPrice} ={" "}
          <span className="font-semibold text-gray-900">₹{item.totalPrice.toFixed(2)}</span>
        </span>
      </div>
    ))}
  </div>
);

export default TransactionItemsList;
