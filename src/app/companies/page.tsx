"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface CompanyData {
  name: string;
  questionCount: number;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        // 获取每个公司的题目数量
        const companyNames = data.companies ?? [];
        Promise.all(
          companyNames.map(async (name: string) => {
            const res = await fetch(`/api/questions?company=${encodeURIComponent(name)}&take=1&skip=0`);
            const qData = await res.json();
            return {
              name,
              questionCount: qData.total ?? 0,
            };
          })
        ).then((results) => {
          // 按题目数量降序排列
          results.sort((a, b) => b.questionCount - a.questionCount);
          setCompanies(results);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error("Failed to load companies:", error);
        setLoading(false);
      });
  }, []);

  // 搜索过滤
  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const keyword = search.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(keyword));
  }, [companies, search]);

  // 生成头像颜色（基于公司名）
  const getAvatarColor = (name: string) => {
    const colors = [
      "#f54e00", "#2a7ae0", "#1f8a65", "#c77800", "#cf2d56",
      "#7c3aed", "#0891b2", "#db2777", "#16a34a", "#ea580c",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-56px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-on-surface-variant">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100dvh-56px)] pt-20 px-4 md:px-8 pb-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-on-surface mb-2">
          🏢 公司题库
        </h1>
        <p className="text-on-surface-variant">
          按公司筛选面试真题，针对性备战
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input
            placeholder="搜索公司..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
          <span>共 <strong className="text-on-surface">{companies.length}</strong> 家公司</span>
          <span>·</span>
          <span><strong className="text-on-surface">{companies.reduce((sum, c) => sum + c.questionCount, 0)}</strong> 道题目</span>
        </div>
      </div>

      {/* Company Grid */}
      <div className="max-w-6xl mx-auto">
        {filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="w-16 h-16 text-on-surface-variant mb-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
            </svg>
            <h3 className="text-lg font-semibold text-on-surface mb-2">
              {search ? "没有找到匹配的公司" : "暂无公司数据"}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {search ? "换个关键词试试" : "题目添加后会自动显示在这里"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCompanies.map((company) => (
              <Link key={company.name} href={`/companies/${encodeURIComponent(company.name)}`}>
                <Card hoverable className="p-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: getAvatarColor(company.name) }}
                  >
                    {company.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      {company.questionCount} 道题目
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="w-5 h-5 text-on-surface-variant shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
