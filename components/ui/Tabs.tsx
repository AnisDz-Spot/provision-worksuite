import React, { ReactNode, useState } from "react";

interface Tab {
  key: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  initialKey?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, initialKey }) => {
  const [activeKey, setActiveKey] = useState(initialKey || tabs[0]?.key);

  const activeTab = tabs.find((tab) => tab.key === activeKey);

  return (
    <div>
      <div className="flex border-b mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-150 focus:outline-none ${
              activeKey === tab.key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-blue-500"
            }`}
            onClick={() => setActiveKey(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeTab?.content}</div>
    </div>
  );
};
