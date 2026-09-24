"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Mail,
  Check,
  X,
  ChevronRight,
  Search,
  Bell,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FormError } from "@/components/ui/Input";
import { AvatarCropper } from "@/components/settings/AvatarCropper";
import { AuthGuard } from "@/components/auth/AuthGuard";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  emailNotifications?: boolean;
  reminderEnabled?: boolean;
}

type SectionKey = "profile" | "security" | "preferences";

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: React.ReactNode;
  desc: string;
}[] = [
  { key: "profile", label: "基本资料", icon: <UserIcon className="w-4 h-4" />, desc: "你的公开信息" },
  { key: "security", label: "账户安全", icon: <Shield className="w-4 h-4" />, desc: "密码与登录方式" },
  { key: "preferences", label: "偏好设置", icon: <Bell className="w-4 h-4" />, desc: "通知与显示" },
];

export default function SettingsPage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<SectionKey>("profile");

  // profile edit
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  // password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error("加载失败");
        const data = await res.json();
        const user = data.user as ProfileData;
        setProfile(user);
        setName(user.name ?? "");
        setBio(user.bio ?? "");
      } catch {
        setSaveErr("加载个人资料失败");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const startEdit = () => {
    setSaveMsg(null);
    setSaveErr(null);
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
    }
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveMsg(null);
    setSaveErr(null);
    if (profile) {
      setName(profile.name ?? "");
      setBio(profile.bio ?? "");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveErr(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "保存失败");
      }
      const updated = await res.json();
      setProfile((prev) => ({ ...(prev as ProfileData), name: updated.name, bio: updated.bio }));
      setEditing(false);
      setSaveMsg("资料已保存");
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 头像上传完成后,持久化 image 字段到后端,并刷新 next-auth session 以让导航栏立即生效
  const saveAvatar = async (url: string) => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
      if (!res.ok) throw new Error("头像保存失败");
      const updated = await res.json();
      setProfile((prev) => ({ ...(prev as ProfileData), image: updated.image ?? url }));
      // 触发 next-auth jwt 回调,重新把最新 image 写进 session,导航栏头像会立即更新
      await update();
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "头像保存失败");
    }
  };

  const changePassword = async () => {
    setPwMsg(null);
    setPwErr(null);
    if (newPassword.length < 6) {
      setPwErr("新密码至少 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr("两次输入的新密码不一致");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "修改失败");
      setPwMsg("密码修改成功");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwErr(err instanceof Error ? err.message : "修改失败");
    } finally {
      setPwLoading(false);
    }
  };

  // 更新通知偏好（邮件通知 / 学习提醒），持久化到后端
  const updatePreferences = async (patch: {
    emailNotifications?: boolean;
    reminderEnabled?: boolean;
  }) => {
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("偏好保存失败");
      const updated = await res.json();
      setProfile((prev) => ({
        ...(prev as ProfileData),
        emailNotifications: updated.emailNotifications,
        reminderEnabled: updated.reminderEnabled,
      }));
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : "偏好保存失败");
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-[400px]">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{
              borderColor: "var(--outline-variant)",
              borderTopColor: "var(--primary)",
            }}
          />
        </div>
      </AuthGuard>
    );
  }

  const activeSection = SECTIONS.find((s) => s.key === active)!;

  return (
    <AuthGuard>
      <div className="max-w-[1080px] mx-auto w-full px-4 md:px-6 pb-12">
        {/* ── Page Header ── */}
        <div className="pt-8 pb-6">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: "var(--on-surface)" }}
          >
            设置
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "var(--on-surface-variant)" }}>
            管理你的账户与偏好
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* ── Side Nav ── */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => {
                const isActive = active === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActive(s.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors"
                    style={{
                      backgroundColor: isActive ? "var(--surface-high)" : "transparent",
                      color: isActive ? "var(--on-surface)" : "var(--on-surface-variant)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    <span style={{ color: isActive ? "var(--primary)" : "var(--on-surface-variant)" }}>
                      {s.icon}
                    </span>
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* ── Main ── */}
          <div className="min-w-0">
            {/* Section Header */}
            <div className="mb-5">
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--on-surface)" }}
              >
                {activeSection.label}
              </h2>
              <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
                {activeSection.desc}
              </p>
            </div>

            {active === "profile" && (
              <ProfileSection
                profile={profile}
                name={name}
                bio={bio}
                setName={setName}
                setBio={setBio}
                editing={editing}
                saving={saving}
                startEdit={startEdit}
                cancelEdit={cancelEdit}
                saveProfile={saveProfile}
                saveMsg={saveMsg}
                saveErr={saveErr}
                onAvatarChange={saveAvatar}
              />
            )}

            {active === "security" && (
              <SecuritySection
                currentPassword={currentPassword}
                setCurrentPassword={setCurrentPassword}
                newPassword={newPassword}
                setNewPassword={setNewPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                pwLoading={pwLoading}
                pwMsg={pwMsg}
                pwErr={pwErr}
                changePassword={changePassword}
              />
            )}

            {active === "preferences" && (
              <PreferencesSection
                emailNotifications={profile?.emailNotifications ?? true}
                reminderEnabled={profile?.reminderEnabled ?? true}
                onToggle={updatePreferences}
              />
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Profile Section
// ────────────────────────────────────────────────────────────────────────────

function ProfileSection({
  profile,
  name,
  bio,
  setName,
  setBio,
  editing,
  saving,
  startEdit,
  cancelEdit,
  saveProfile,
  saveMsg,
  saveErr,
  onAvatarChange,
}: {
  profile: ProfileData | null;
  name: string;
  bio: string;
  setName: (s: string) => void;
  setBio: (s: string) => void;
  editing: boolean;
  saving: boolean;
  startEdit: () => void;
  cancelEdit: () => void;
  saveProfile: () => void;
  saveMsg: string | null;
  saveErr: string | null;
  onAvatarChange: (url: string) => void;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      {/* Avatar upload */}
      <div
        className="px-6 py-6 border-b"
        style={{ borderColor: "var(--outline-variant)" }}
      >
        <p className="text-sm font-medium mb-3" style={{ color: "var(--on-surface)" }}>
          头像
        </p>
        <AvatarCropper value={profile?.image ?? ""} onChange={onAvatarChange} />
      </div>

      {/* Fields */}
      <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
        <Field
          label="邮箱"
          badge="已锁定"
          desc="作为登录账户,不可修改"
        >
          <span className="text-sm" style={{ color: "var(--on-surface)" }}>
            {profile?.email}
          </span>
        </Field>

        <Field label="昵称">
          {editing ? (
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入昵称" />
          ) : (
            <span className="text-sm" style={{ color: "var(--on-surface)" }}>
              {name || "未填写"}
            </span>
          )}
        </Field>

        <Field label="个人简介" desc="简要介绍你自己,会展示在公开主页上">
          {editing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="介绍一下自己"
              className="w-full px-4 py-3 text-sm rounded-lg resize-y min-h-[100px] outline-none transition-colors bg-surface-highest border border-outline-variant text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
            />
          ) : (
            <span
              className="text-sm whitespace-pre-wrap"
              style={{ color: bio ? "var(--on-surface)" : "var(--on-surface-variant)" }}
            >
              {bio || "未填写"}
            </span>
          )}
        </Field>
      </div>

      {/* Footer actions */}
      <div
        className="px-6 py-4 flex items-center justify-end gap-2"
        style={{ backgroundColor: "var(--surface-low)" }}
      >
        {!editing ? (
          <Button variant="secondary" size="sm" onClick={startEdit}>
            编辑资料
          </Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>
              取消
            </Button>
            <Button variant="primary" size="sm" onClick={saveProfile} disabled={saving}>
              {saving ? "保存中..." : "保存修改"}
            </Button>
          </>
        )}
      </div>

      {(saveErr || saveMsg) && (
        <div className="px-6 pb-4">
          {saveErr && <FormError>{saveErr}</FormError>}
          {saveMsg && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <Check className="w-3.5 h-3.5" />
              {saveMsg}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Security Section
// ────────────────────────────────────────────────────────────────────────────

function SecuritySection({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  pwLoading,
  pwMsg,
  pwErr,
  changePassword,
}: {
  currentPassword: string;
  setCurrentPassword: (s: string) => void;
  newPassword: string;
  setNewPassword: (s: string) => void;
  confirmPassword: string;
  setConfirmPassword: (s: string) => void;
  pwLoading: boolean;
  pwMsg: string | null;
  pwErr: string | null;
  changePassword: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden">
        <div
          className="px-6 py-5 border-b"
          style={{ borderColor: "var(--outline-variant)" }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--surface-high)", color: "var(--primary)" }}
            >
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--on-surface)" }}>
                密码
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
                设置一个强密码以保护账户安全
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--on-surface)" }}>
              当前密码
            </label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="输入当前密码"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--on-surface)" }}>
              新密码
            </label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 6 位"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--on-surface)" }}>
              确认新密码
            </label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {pwErr && <FormError>{pwErr}</FormError>}
          {pwMsg && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--success)" }}>
              <Check className="w-3.5 h-3.5" />
              {pwMsg}
            </p>
          )}
        </div>

        <div
          className="px-6 py-4 flex items-center justify-end"
          style={{ backgroundColor: "var(--surface-low)" }}
        >
          <Button variant="primary" size="sm" onClick={changePassword} disabled={pwLoading}>
            {pwLoading ? "提交中..." : "更新密码"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Preferences Section
// ────────────────────────────────────────────────────────────────────────────

function PreferencesSection({
  emailNotifications,
  reminderEnabled,
  onToggle,
}: {
  emailNotifications: boolean;
  reminderEnabled: boolean;
  onToggle: (patch: {
    emailNotifications?: boolean;
    reminderEnabled?: boolean;
  }) => void;
}) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="divide-y" style={{ borderColor: "var(--outline-variant)" }}>
        <ToggleRow
          title="邮件通知"
          desc="接收关于新评论、关注与系统通知的邮件"
          checked={emailNotifications}
          onChange={(v) => onToggle({ emailNotifications: v })}
        />
        <ToggleRow
          title="学习提醒"
          desc="每日提醒你复习待学的题目"
          checked={reminderEnabled}
          onChange={(v) => onToggle({ reminderEnabled: v })}
        />
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared bits
// ────────────────────────────────────────────────────────────────────────────

function Field({
  label,
  desc,
  badge,
  children,
}: {
  label: string;
  desc?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2 sm:gap-6 items-start">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
            {label}
          </p>
          {badge && (
            <span
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: "var(--surface-high)",
                color: "var(--on-surface-variant)",
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {desc && (
          <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
            {desc}
          </p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--on-surface)" }}>
          {title}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--on-surface-variant)" }}>
          {desc}
        </p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{
        backgroundColor: checked ? "var(--primary)" : "var(--surface-high)",
        border: checked ? "none" : "1px solid var(--outline-variant)",
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
        style={{
          backgroundColor: "var(--on-primary, white)",
          left: checked ? "calc(100% - 22px)" : "2px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
