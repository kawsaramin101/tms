
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";

import {
  createFeePayment,
  createFeeType,
  createMember,
  createMemberFee,
  listFeePayments,
  listFeeTypes,
  listMembers,
  listMemberFees,
  updateMember,
  updateMemberStatus,
  updateFeeType,
  updateFeeTypeStatus,
  updateMemberFee,
  updateMemberFeeStatus,
} from "@/modules/members-fees/api";

import type {
  MemberDto,
  FeeTypeDto,
  MemberFeeDto,
  FeePaymentDto,
  CreateMemberRequest,
  CreateFeeTypeRequest,
  CreateMemberFeeRequest,
  CreateFeePaymentRequest,
  MemberStatus,
  FeeTypeStatus,
  FeeStatus,
  PaymentMethod,
} from "@/modules/members-fees/types";

type Tab = "members" | "types" | "fees" | "payments";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";

const buttonClass =
  "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";

const secondaryClass =
  "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50";

function getToken(): string {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function money(value: number): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function MembersPage() {
  const [tab, setTab] = useState<Tab>("members");

  const [members, setMembers] = useState<MemberDto[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeTypeDto[]>([]);
  const [fees, setFees] = useState<MemberFeeDto[]>([]);
  const [payments, setPayments] = useState<FeePaymentDto[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [memberForm, setMemberForm] = useState({
    memberCode: "",
    name: "",
    memberType: "",
    department: "",
    phone: "",
    email: "",
    address: "",
  });
  const [editingMember, setEditingMember] = useState<MemberDto | null>(null);

  const [typeForm, setTypeForm] = useState({
    feeName: "",
    defaultAmount: "",
    description: "",
  });
  const [editingType, setEditingType] = useState<FeeTypeDto | null>(null);

  const [feeForm, setFeeForm] = useState({
    memberId: "",
    feeTypeId: "",
    amountDue: "",
    discount: "0",
    fine: "0",
    dueDate: "",
  });
  const [editingFee, setEditingFee] = useState<MemberFeeDto | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    memberFeeId: "",
    receiptNumber: "",
    amount: "",
    paymentMethod: "CASH" as PaymentMethod,
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: "",
    remarks: "",
  });

  const loadData = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError(
        "Authentication token not found. Please check the token key used by your login flow.",
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const results = await Promise.all([
        listMembers(token),
        listFeeTypes(token),
        listMemberFees(token),
        listFeePayments(token),
      ]);

      setMembers(results[0]);
      setFeeTypes(results[1]);
      setFees(results[2]);
      setPayments(results[3]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return members;

    return members.filter((member) =>
      [
        member.memberCode,
        member.name,
        member.memberType,
        member.department ?? "",
        member.phone ?? "",
        member.email ?? "",
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [members, search]);

  const totalDue = fees.reduce(
    (sum, fee) =>
      sum +
      Math.max(
        0,
        Number(fee.amountDue) +
          Number(fee.fine) -
          Number(fee.discount) -
          Number(fee.amountPaid),
      ),
    0,
  );

  async function perform(
    action: () => Promise<unknown>,
    message: string,
  ) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(message);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "The operation failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitMember(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const data: CreateMemberRequest = {
      memberCode: memberForm.memberCode.trim(),
      name: memberForm.name.trim(),
      memberType: memberForm.memberType.trim(),
      department: memberForm.department.trim() || undefined,
      phone: memberForm.phone.trim() || undefined,
      email: memberForm.email.trim() || undefined,
      address: memberForm.address.trim() || undefined,
    };

    await perform(async () => {
      if (editingMember) {
        await updateMember(getToken(), editingMember.memberId, {
          memberCode: data.memberCode,
          name: data.name,
          memberType: data.memberType,
          department: data.department,
          phone: data.phone,
          email: data.email,
          address: data.address,
        });
        setEditingMember(null);
      } else {
        await createMember(getToken(), data);
      }

      setMemberForm({
        memberCode: "",
        name: "",
        memberType: "",
        department: "",
        phone: "",
        email: "",
        address: "",
      });
    }, editingMember ? "Member updated successfully." : "Member created successfully.");
  }

  async function submitFeeType(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const data: CreateFeeTypeRequest = {
      feeName: typeForm.feeName.trim(),
      defaultAmount: Number(typeForm.defaultAmount),
      description: typeForm.description.trim() || undefined,
    };

    if (
      !Number.isFinite(data.defaultAmount) ||
      data.defaultAmount < 0
    ) {
      setError("Please enter a valid fee amount.");
      return;
    }

    await perform(async () => {
      if (editingType) {
        await updateFeeType(getToken(), editingType.feeTypeId, {
          feeName: data.feeName,
          defaultAmount: data.defaultAmount,
          description: data.description,
        });
        setEditingType(null);
      } else {
        await createFeeType(getToken(), data);
      }

      setTypeForm({
        feeName: "",
        defaultAmount: "",
        description: "",
      });
    }, editingType ? "Fee type updated successfully." : "Fee type created successfully.");
  }

  async function submitFee(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const selectedType = feeTypes.find(
      (item) =>
        item.feeTypeId === Number(feeForm.feeTypeId),
    );

    const data: CreateMemberFeeRequest = {
      memberId: Number(feeForm.memberId),
      feeTypeId: Number(feeForm.feeTypeId),
      amountDue:
        feeForm.amountDue === ""
          ? selectedType?.defaultAmount
          : Number(feeForm.amountDue),
      discount: Number(feeForm.discount || 0),
      fine: Number(feeForm.fine || 0),
      dueDate: feeForm.dueDate,
    };

    if (
      !data.memberId ||
      !data.feeTypeId ||
      !data.dueDate ||
      !Number.isFinite(Number(data.amountDue)) ||
      Number(data.amountDue) < 0 ||
      !Number.isFinite(Number(data.discount)) ||
      Number(data.discount) < 0 ||
      !Number.isFinite(Number(data.fine)) ||
      Number(data.fine) < 0
    ) {
      setError("Please enter valid member fee details.");
      return;
    }

    await perform(async () => {
      if (editingFee) {
        await updateMemberFee(getToken(), editingFee.memberFeeId, {
          amountDue: data.amountDue,
          discount: data.discount,
          fine: data.fine,
          dueDate: data.dueDate,
        });
        setEditingFee(null);
      } else {
        await createMemberFee(getToken(), data);
      }

      setFeeForm({
        memberId: "",
        feeTypeId: "",
        amountDue: "",
        discount: "0",
        fine: "0",
        dueDate: "",
      });
    }, editingFee ? "Member fee updated successfully." : "Member fee assigned successfully.");
  }

  async function submitPayment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const data: CreateFeePaymentRequest = {
      memberFeeId: Number(paymentForm.memberFeeId),
      receiptNumber: paymentForm.receiptNumber.trim(),
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      paymentDate: paymentForm.paymentDate || undefined,
      referenceNumber:
        paymentForm.referenceNumber.trim() || undefined,
      remarks: paymentForm.remarks.trim() || undefined,
    };

    if (
      !data.memberFeeId ||
      !data.receiptNumber ||
      !Number.isFinite(data.amount) ||
      data.amount <= 0
    ) {
      setError("Please select a fee and enter a valid payment amount.");
      return;
    }

    const selectedFee = fees.find(
      (fee) => fee.memberFeeId === data.memberFeeId,
    );

    if (!selectedFee) {
      setError("The selected member fee could not be found.");
      return;
    }

    const outstanding = Math.max(
      0,
      Number(selectedFee.amountDue) +
        Number(selectedFee.fine) -
        Number(selectedFee.discount) -
        Number(selectedFee.amountPaid),
    );

    if (data.amount > outstanding) {
      setError(
        `Payment cannot exceed the outstanding balance of ${money(outstanding)}.`,
      );
      return;
    }

    await perform(async () => {
      await createFeePayment(getToken(), data);

      setPaymentForm({
        memberFeeId: "",
        receiptNumber: "",
        amount: "",
        paymentMethod: "CASH",
        paymentDate: new Date().toISOString().slice(0, 10),
        referenceNumber: "",
        remarks: "",
      });
    }, "Payment recorded successfully.");
  }

  async function changeMemberStatus(member: MemberDto) {
    const status: MemberStatus =
      member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await perform(
      () =>
        updateMemberStatus(
          getToken(),
          member.memberId,
          { status },
        ),
      "Member status updated successfully.",
    );
  }

  function startEditMember(member: MemberDto) {
    setEditingMember(member);
    setMemberForm({
      memberCode: member.memberCode,
      name: member.name,
      memberType: member.memberType,
      department: member.department ?? "",
      phone: member.phone ?? "",
      email: member.email ?? "",
      address: member.address ?? "",
    });
    setTab("members");
  }

  function cancelEditMember() {
    setEditingMember(null);
    setMemberForm({
      memberCode: "",
      name: "",
      memberType: "",
      department: "",
      phone: "",
      email: "",
      address: "",
    });
  }

  async function changeFeeTypeStatus(item: FeeTypeDto) {
    const status: FeeTypeStatus =
      item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    await perform(
      () =>
        updateFeeTypeStatus(
          getToken(),
          item.feeTypeId,
          status,
        ),
      "Fee type status updated successfully.",
    );
  }

  function startEditType(item: FeeTypeDto) {
    setEditingType(item);
    setTypeForm({
      feeName: item.feeName,
      defaultAmount: String(item.defaultAmount),
      description: item.description ?? "",
    });
    setTab("types");
  }

  function cancelEditType() {
    setEditingType(null);
    setTypeForm({
      feeName: "",
      defaultAmount: "",
      description: "",
    });
  }

  function memberName(id: number) {
    const member = members.find(
      (item) => item.memberId === id,
    );

    return member
      ? `${member.name} (${member.memberCode})`
      : `Member #${id}`;
  }

  function feeName(id: number) {
    return (
      feeTypes.find((item) => item.feeTypeId === id)
        ?.feeName ?? `Fee #${id}`
    );
  }

  function startEditFee(fee: MemberFeeDto) {
    setEditingFee(fee);
    setFeeForm({
      memberId: String(fee.memberId),
      feeTypeId: String(fee.feeTypeId),
      amountDue: String(fee.amountDue),
      discount: String(fee.discount),
      fine: String(fee.fine),
      dueDate: fee.dueDate.slice(0, 10),
    });
    setTab("fees");
  }

  async function changeMemberFeeStatus(fee: MemberFeeDto, status: FeeStatus) {
    await perform(
      () => updateMemberFeeStatus(getToken(), fee.memberFeeId, status),
      "Member fee status updated successfully.",
    );
  }

  function cancelEditFee() {
    setEditingFee(null);
    setFeeForm({
      memberId: "",
      feeTypeId: "",
      amountDue: "",
      discount: "0",
      fine: "0",
      dueDate: "",
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "members", label: "Members" },
    { id: "types", label: "Fee Types" },
    { id: "fees", label: "Member Fees" },
    { id: "payments", label: "Payments" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Member &amp; Fee Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage members, fee assignments, and payments.
          </p>
        </div>

        <button
          type="button"
          className={secondaryClass}
          disabled={loading || saving}
          onClick={() => void loadData()}
        >
          Refresh
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Total Members
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {members.length}
          </p>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Active Fee Types
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {
              feeTypes.filter(
                (item) => item.status === "ACTIVE",
              ).length
            }
          </p>
        </div>

        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">
            Total Outstanding
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {money(totalDue)}
          </p>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-border p-3 text-sm"
        >
          {notice}
        </div>
      )}

      <nav className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? buttonClass
                : secondaryClass
            }
          >
            {item.label}
          </button>
        ))}
      </nav>

      {loading ? (
        <p className="py-8 text-sm text-muted-foreground">
          Loading data...
        </p>
      ) : (
        <>
          {tab === "members" && (
            <section className="space-y-6">
              <form
                onSubmit={submitMember}
                className="rounded-xl border border-border p-4 sm:p-6"
              >
                  <h2 className="mb-4 text-lg font-semibold">
                    {editingMember ? "Edit Member" : "Add New Member"}
                  </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Member Code *">
                    <input
                      required
                      className={inputClass}
                      value={memberForm.memberCode}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          memberCode: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Full Name *">
                    <input
                      required
                      className={inputClass}
                      value={memberForm.name}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          name: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Member Type *">
                    <input
                      required
                      placeholder="e.g. Student"
                      className={inputClass}
                      value={memberForm.memberType}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          memberType: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Department">
                    <input
                      className={inputClass}
                      value={memberForm.department}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          department: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Phone Number">
                    <input
                      type="tel"
                      className={inputClass}
                      value={memberForm.phone}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          phone: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Email Address">
                    <input
                      type="email"
                      className={inputClass}
                      value={memberForm.email}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          email: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Address">
                    <input
                      className={inputClass}
                      value={memberForm.address}
                      onChange={(event) =>
                        setMemberForm({
                          ...memberForm,
                          address: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className={buttonClass}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingMember ? "Update Member" : "Add Member"}
                  </button>
                  {editingMember && (
                    <button
                      type="button"
                      className={secondaryClass}
                      disabled={saving}
                      onClick={cancelEditMember}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">
                    Members ({filteredMembers.length})
                  </h2>

                  <input
                    className={`${inputClass} max-w-sm`}
                    placeholder="Search by name, code, department, or phone"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />
                </div>

                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Type / Department</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr
                          key={member.memberId}
                          className="border-t border-border"
                        >
                          <td className="p-3">
                            {member.memberCode}
                          </td>

                          <td className="p-3 font-medium">
                            {member.name}
                          </td>

                          <td className="p-3">
                            {member.memberType}
                            <div className="text-xs text-muted-foreground">
                              {member.department || "—"}
                            </div>
                          </td>

                          <td className="p-3">
                            {member.phone ||
                              member.email ||
                              "—"}
                          </td>

                          <td className="p-3">
                            {member.status}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={secondaryClass}
                                disabled={saving}
                                onClick={() => startEditMember(member)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={secondaryClass}
                                disabled={saving}
                                onClick={() =>
                                  void changeMemberStatus(member)
                                }
                              >
                                {member.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredMembers.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-6 text-center text-muted-foreground"
                          >
                            No members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          )}

          {tab === "types" && (
            <section className="space-y-6">
              <form
                onSubmit={submitFeeType}
                className="rounded-xl border border-border p-4 sm:p-6"
              >
                  <h2 className="mb-4 text-lg font-semibold">
                    {editingType ? "Edit Fee Type" : "Create Fee Type"}
                  </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Fee Name *">
                    <input
                      required
                      className={inputClass}
                      value={typeForm.feeName}
                      onChange={(event) =>
                        setTypeForm({
                          ...typeForm,
                          feeName: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Default Amount (BDT) *">
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={typeForm.defaultAmount}
                      onChange={(event) =>
                        setTypeForm({
                          ...typeForm,
                          defaultAmount: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Description">
                    <input
                      className={inputClass}
                      value={typeForm.description}
                      onChange={(event) =>
                        setTypeForm({
                          ...typeForm,
                          description: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className={buttonClass}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingType ? "Update Fee Type" : "Create Fee Type"}
                  </button>
                  {editingType && (
                    <button
                      type="button"
                      className={secondaryClass}
                      disabled={saving}
                      onClick={cancelEditType}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3">Fee Name</th>
                      <th className="p-3">Default Amount</th>
                      <th className="p-3">Description</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {feeTypes.map((item) => (
                      <tr
                        key={item.feeTypeId}
                        className="border-t border-border"
                      >
                        <td className="p-3 font-medium">
                          {item.feeName}
                        </td>

                        <td className="p-3">
                          {money(item.defaultAmount)}
                        </td>

                        <td className="p-3">
                          {item.description || "—"}
                        </td>

                        <td className="p-3">
                          {item.status}
                        </td>

                        <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={secondaryClass}
                                disabled={saving}
                                onClick={() => startEditType(item)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className={secondaryClass}
                                disabled={saving}
                                onClick={() =>
                                  void changeFeeTypeStatus(item)
                                }
                              >
                                {item.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                            </div>
                        </td>
                      </tr>
                    ))}

                    {feeTypes.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No fee types found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "fees" && (
            <section className="space-y-6">
              <form
                onSubmit={submitFee}
                className="rounded-xl border border-border p-4 sm:p-6"
              >
                  <h2 className="mb-4 text-lg font-semibold">
                    {editingFee ? "Edit Member Fee" : "Assign Fee to Member"}
                  </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Member *">
                    <select
                      required
                      className={inputClass}
                      value={feeForm.memberId}
                      onChange={(event) =>
                        setFeeForm({
                          ...feeForm,
                          memberId: event.target.value,
                        })
                      }
                    >
                      <option value="">Select a member</option>

                      {members
                        .filter(
                          (member) =>
                            member.status === "ACTIVE",
                        )
                        .map((member) => (
                          <option
                            key={member.memberId}
                            value={member.memberId}
                          >
                            {member.memberCode} — {member.name}
                          </option>
                        ))}
                    </select>
                  </Field>

                  <Field label="Fee Type *">
                    <select
                      required
                      className={inputClass}
                      value={feeForm.feeTypeId}
                      onChange={(event) => {
                        const selected = feeTypes.find(
                          (item) =>
                            item.feeTypeId ===
                            Number(event.target.value),
                        );

                        setFeeForm({
                          ...feeForm,
                          feeTypeId: event.target.value,
                          amountDue: selected
                            ? String(selected.defaultAmount)
                            : "",
                        });
                      }}
                    >
                      <option value="">Select a fee type</option>

                      {feeTypes
                        .filter(
                          (item) =>
                            item.status === "ACTIVE",
                        )
                        .map((item) => (
                          <option
                            key={item.feeTypeId}
                            value={item.feeTypeId}
                          >
                            {item.feeName} —{" "}
                            {money(item.defaultAmount)}
                          </option>
                        ))}
                    </select>
                  </Field>

                  <Field label="Fee Amount (BDT)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={feeForm.amountDue}
                      onChange={(event) =>
                        setFeeForm({
                          ...feeForm,
                          amountDue: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Discount (BDT)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={feeForm.discount}
                      onChange={(event) =>
                        setFeeForm({
                          ...feeForm,
                          discount: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Fine (BDT)">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass}
                      value={feeForm.fine}
                      onChange={(event) =>
                        setFeeForm({
                          ...feeForm,
                          fine: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Due Date *">
                    <input
                      required
                      type="date"
                      className={inputClass}
                      value={feeForm.dueDate}
                      onChange={(event) =>
                        setFeeForm({
                          ...feeForm,
                          dueDate: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    className={buttonClass}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingFee ? "Update Fee" : "Assign Fee"}
                  </button>
                  {editingFee && (
                    <button
                      type="button"
                      className={secondaryClass}
                      disabled={saving}
                      onClick={cancelEditFee}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3">Member</th>
                      <th className="p-3">Fee Type</th>
                      <th className="p-3">Amount Due</th>
                      <th className="p-3">Amount Paid</th>
                      <th className="p-3">Outstanding</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fees.map((fee) => {
                      const due = Math.max(
                        0,
                        Number(fee.amountDue) +
                          Number(fee.fine) -
                          Number(fee.discount) -
                          Number(fee.amountPaid),
                      );

                      return (
                        <tr
                          key={fee.memberFeeId}
                          className="border-t border-border"
                        >
                          <td className="p-3">
                            {memberName(fee.memberId)}
                          </td>

                          <td className="p-3">
                            {feeName(fee.feeTypeId)}
                          </td>

                          <td className="p-3">
                            {money(fee.amountDue)}
                          </td>

                          <td className="p-3">
                            {money(fee.amountPaid)}
                          </td>

                          <td className="p-3">
                            {money(due)}
                          </td>

                          <td className="p-3">
                            {fee.dueDate.slice(0, 10)}
                          </td>

                          <td className="p-3">
                            {fee.status}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={secondaryClass}
                                disabled={saving}
                                onClick={() => startEditFee(fee)}
                              >
                                Edit
                              </button>
                              <select
                                className={`${inputClass} w-auto`}
                                value={fee.status}
                                disabled={saving}
                                onChange={(event) =>
                                  void changeMemberFeeStatus(
                                    fee,
                                    event.target.value as FeeStatus,
                                  )
                                }
                              >
                                <option value="PENDING">PENDING</option>
                                <option value="PARTIAL">PARTIAL</option>
                                <option value="PAID">PAID</option>
                                <option value="OVERDUE">OVERDUE</option>
                                <option value="CANCELLED">CANCELLED</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {fees.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No member fees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab === "payments" && (
            <section className="space-y-6">
              <form
                onSubmit={submitPayment}
                className="rounded-xl border border-border p-4 sm:p-6"
              >
                <h2 className="mb-4 text-lg font-semibold">
                  Record Payment
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Member Fee *">
                    <select
                      required
                      className={inputClass}
                      value={paymentForm.memberFeeId}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          memberFeeId: event.target.value,
                        })
                      }
                    >
                      <option value="">Select a member fee</option>

                      {fees
                        .filter((fee) =>
                          [
                            "PENDING",
                            "PARTIAL",
                            "OVERDUE",
                          ].includes(fee.status),
                        )
                        .map((fee) => {
                          const outstanding = Math.max(
                            0,
                            Number(fee.amountDue) +
                              Number(fee.fine) -
                              Number(fee.discount) -
                              Number(fee.amountPaid),
                          );

                          return (
                            <option
                              key={fee.memberFeeId}
                              value={fee.memberFeeId}
                            >
                              {memberName(fee.memberId)} —{" "}
                              {feeName(fee.feeTypeId)} — Outstanding:{" "}
                              {money(outstanding)}
                            </option>
                          );
                        })}
                    </select>
                  </Field>

                  <Field label="Receipt Number *">
                    <input
                      required
                      className={inputClass}
                      value={paymentForm.receiptNumber}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          receiptNumber: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Payment Amount (BDT) *">
                    <input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClass}
                      value={paymentForm.amount}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          amount: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Payment Method *">
                    <select
                      required
                      className={inputClass}
                      value={paymentForm.paymentMethod}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentMethod: event.target.value as PaymentMethod,
                        })
                      }
                    >
                      <option value="CASH">Cash</option>
                      <option value="BANK_TRANSFER">
                        Bank Transfer
                      </option>
                      <option value="CARD">Card</option>
                      <option value="MOBILE_BANKING">
                        Mobile Banking
                      </option>
                    </select>
                  </Field>

                  <Field label="Payment Date">
                    <input
                      type="date"
                      className={inputClass}
                      value={paymentForm.paymentDate}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          paymentDate: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Reference Number">
                    <input
                      className={inputClass}
                      value={paymentForm.referenceNumber}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          referenceNumber: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Remarks">
                    <input
                      className={inputClass}
                      value={paymentForm.remarks}
                      onChange={(event) =>
                        setPaymentForm({
                          ...paymentForm,
                          remarks: event.target.value,
                        })
                      }
                    />
                  </Field>
                </div>

                <button
                  className={`${buttonClass} mt-4`}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Payment"}
                </button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3">Receipt</th>
                      <th className="p-3">Member</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>

                  <tbody>
                    {payments.map((payment) => {
                      const fee = fees.find(
                        (item) =>
                          item.memberFeeId === payment.memberFeeId,
                      );

                      return (
                        <tr
                          key={payment.paymentId}
                          className="border-t border-border"
                        >
                          <td className="p-3">
                            {payment.receiptNumber}
                          </td>

                          <td className="p-3">
                            {fee
                              ? memberName(fee.memberId)
                              : `Fee #${payment.memberFeeId}`}
                          </td>

                          <td className="p-3">
                            {money(payment.amount)}
                          </td>

                          <td className="p-3">
                            {payment.paymentMethod}
                          </td>

                          <td className="p-3">
                            {payment.paymentDate.slice(0, 10)}
                          </td>

                          <td className="p-3">
                            {payment.referenceNumber || "—"}
                          </td>

                          <td className="p-3">
                            {payment.remarks || "—"}
                          </td>
                        </tr>
                      );
                    })}

                    {payments.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
