import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/error.middleware.js";
import {
  toMemberDto,
  toFeeTypeDto,
  toMemberFeeDto,
  toFeePaymentDto,
} from "./member.types.js";
import type {
  MemberDto,
  MemberStatus,
  FeeTypeDto,
  FeeTypeStatus,
  MemberFeeDto,
  FeeStatus,
  FeePaymentDto,
  CreateMemberRequest,
  UpdateMemberRequest,
  CreateFeeTypeRequest,
  UpdateFeeTypeRequest,
  CreateMemberFeeRequest,
  UpdateMemberFeeRequest,
  CreateFeePaymentRequest,
} from "@tms/contracts";

async function writeAudit(
  actorId: number,
  action: string,
  recordId: number | null,
  description: string,
  ipAddress?: string,
  tableName: string = "members",
) {
  await prisma.auditLog.create({
    data: {
      userId: actorId,
      action,
      tableName,
      recordId,
      description,
      ipAddress: ipAddress ?? null,
    },
  });
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function netAmountDue(amountDue: number, discount: number, fine: number): number {
  return roundMoney(amountDue - discount + fine);
}

export async function listMembers(): Promise<MemberDto[]> {
  const members = await prisma.member.findMany({ orderBy: { memberId: "asc" } });
  return members.map(toMemberDto);
}

export async function getMember(id: number): Promise<MemberDto> {
  const member = await prisma.member.findUnique({ where: { memberId: id } });
  if (!member) throw new HttpError(404, "Member not found");
  return toMemberDto(member);
}

export async function createMember(
  actorId: number,
  data: CreateMemberRequest,
  ipAddress?: string,
): Promise<MemberDto> {
  const existing = await prisma.member.findUnique({ where: { memberCode: data.memberCode } });
  if (existing) throw new HttpError(409, "Member code already exists");

  const member = await prisma.member.create({
    data: {
      memberCode: data.memberCode,
      name: data.name,
      memberType: data.memberType,
      department: data.department ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      status: data.status ?? "ACTIVE",
    },
  });

  await writeAudit(
    actorId,
    "CREATE_MEMBER",
    member.memberId,
    `Created member ${member.memberCode}`,
    ipAddress,
  );
  return toMemberDto(member);
}

export async function updateMember(
  actorId: number,
  id: number,
  data: UpdateMemberRequest,
  ipAddress?: string,
): Promise<MemberDto> {
  const member = await prisma.member.findUnique({ where: { memberId: id } });
  if (!member) throw new HttpError(404, "Member not found");

  if (data.memberCode && data.memberCode !== member.memberCode) {
    const codeTaken = await prisma.member.findUnique({ where: { memberCode: data.memberCode } });
    if (codeTaken) throw new HttpError(409, "Member code already exists");
  }

  const updated = await prisma.member.update({
    where: { memberId: id },
    data: {
      ...(data.memberCode !== undefined ? { memberCode: data.memberCode } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.memberType !== undefined ? { memberType: data.memberType } : {}),
      ...(data.department !== undefined ? { department: data.department } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
    },
  });

  await writeAudit(
    actorId,
    "UPDATE_MEMBER",
    updated.memberId,
    `Updated member ${updated.memberCode}`,
    ipAddress,
  );
  return toMemberDto(updated);
}

export async function updateMemberStatus(
  actorId: number,
  id: number,
  status: MemberStatus,
  ipAddress?: string,
): Promise<MemberDto> {
  const member = await prisma.member.findUnique({ where: { memberId: id } });
  if (!member) throw new HttpError(404, "Member not found");

  const updated = await prisma.member.update({
    where: { memberId: id },
    data: { status },
  });

  await writeAudit(
    actorId,
    status === "ACTIVE" ? "ACTIVATE_MEMBER" : "DEACTIVATE_MEMBER",
    updated.memberId,
    `Set status of ${updated.memberCode} to ${status}`,
    ipAddress,
  );
  return toMemberDto(updated);
}

export async function searchMembers(query: {
  q?: string | undefined;
  memberType?: string | undefined;
  department?: string | undefined;
  status?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const where: any = {
    ...(query.memberType ? { memberType: query.memberType } : {}),
    ...(query.department ? { department: query.department } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [
            { memberCode: { contains: query.q } },
            { name: { contains: query.q } },
            { email: { contains: query.q } },
            { phone: { contains: query.q } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy: { memberId: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(toMemberDto),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function listFeeTypes(): Promise<FeeTypeDto[]> {
  const types = await prisma.feeType.findMany({ orderBy: { feeTypeId: "asc" } });
  return types.map(toFeeTypeDto);
}

export async function getFeeType(id: number): Promise<FeeTypeDto> {
  const type = await prisma.feeType.findUnique({ where: { feeTypeId: id } });
  if (!type) throw new HttpError(404, "Fee type not found");
  return toFeeTypeDto(type);
}

export async function createFeeType(
  actorId: number,
  data: CreateFeeTypeRequest,
  ipAddress?: string,
): Promise<FeeTypeDto> {
  const type = await prisma.feeType.create({
    data: {
      feeName: data.feeName,
      defaultAmount: data.defaultAmount,
      description: data.description ?? null,
      status: data.status ?? "ACTIVE",
    },
  });

  await writeAudit(
    actorId,
    "CREATE_FEE_TYPE",
    type.feeTypeId,
    `Created fee type ${type.feeName}`,
    ipAddress,
    "fee_types",
  );
  return toFeeTypeDto(type);
}

export async function updateFeeType(
  actorId: number,
  id: number,
  data: UpdateFeeTypeRequest,
  ipAddress?: string,
): Promise<FeeTypeDto> {
  const type = await prisma.feeType.findUnique({ where: { feeTypeId: id } });
  if (!type) throw new HttpError(404, "Fee type not found");

  const updated = await prisma.feeType.update({
    where: { feeTypeId: id },
    data: {
      ...(data.feeName !== undefined ? { feeName: data.feeName } : {}),
      ...(data.defaultAmount !== undefined ? { defaultAmount: data.defaultAmount } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });

  await writeAudit(
    actorId,
    "UPDATE_FEE_TYPE",
    updated.feeTypeId,
    `Updated fee type ${updated.feeName}`,
    ipAddress,
    "fee_types",
  );
  return toFeeTypeDto(updated);
}

export async function updateFeeTypeStatus(
  actorId: number,
  id: number,
  status: FeeTypeStatus,
  ipAddress?: string,
): Promise<FeeTypeDto> {
  const type = await prisma.feeType.findUnique({ where: { feeTypeId: id } });
  if (!type) throw new HttpError(404, "Fee type not found");

  const updated = await prisma.feeType.update({
    where: { feeTypeId: id },
    data: { status },
  });

  await writeAudit(
    actorId,
    status === "ACTIVE" ? "ACTIVATE_FEE_TYPE" : "DEACTIVATE_FEE_TYPE",
    updated.feeTypeId,
    `Set fee type status to ${status}`,
    ipAddress,
    "fee_types",
  );
  return toFeeTypeDto(updated);
}

export async function listMemberFees(): Promise<MemberFeeDto[]> {
  const fees = await prisma.memberFee.findMany({ orderBy: { memberFeeId: "asc" } });
  return fees.map(toMemberFeeDto);
}

export async function getMemberFee(id: number): Promise<MemberFeeDto> {
  const fee = await prisma.memberFee.findUnique({ where: { memberFeeId: id } });
  if (!fee) throw new HttpError(404, "Member fee not found");
  return toMemberFeeDto(fee);
}

export async function createMemberFee(
  actorId: number,
  data: CreateMemberFeeRequest,
  ipAddress?: string,
): Promise<MemberFeeDto> {
  const member = await prisma.member.findUnique({ where: { memberId: data.memberId } });
  if (!member) throw new HttpError(404, "Member not found");
  const feeType = await prisma.feeType.findUnique({ where: { feeTypeId: data.feeTypeId } });
  if (!feeType) throw new HttpError(404, "Fee type not found");

  const amountDue = data.amountDue ?? Number(feeType.defaultAmount);
  const discount = data.discount ?? 0;
  const fine = data.fine ?? 0;
  if (discount > amountDue + fine) {
    throw new HttpError(400, "Discount cannot exceed the amount due plus fine");
  }

  const memberFee = await prisma.memberFee.create({
    data: {
      memberId: data.memberId,
      feeTypeId: data.feeTypeId,
      amountDue,
      amountPaid: 0,
      discount,
      fine,
      dueDate: new Date(data.dueDate),
      status: data.status ?? "PENDING",
    },
  });

  await writeAudit(
    actorId,
    "CREATE_MEMBER_FEE",
    memberFee.memberFeeId,
    `Created member fee ${memberFee.memberFeeId}`,
    ipAddress,
    "member_fees",
  );
  return toMemberFeeDto(memberFee);
}

export async function updateMemberFee(
  actorId: number,
  id: number,
  data: UpdateMemberFeeRequest,
  ipAddress?: string,
): Promise<MemberFeeDto> {
  const fee = await prisma.memberFee.findUnique({ where: { memberFeeId: id } });
  if (!fee) throw new HttpError(404, "Member fee not found");

  const amountDue = data.amountDue ?? Number(fee.amountDue);
  const discount = data.discount ?? Number(fee.discount);
  const fine = data.fine ?? Number(fee.fine);
  if (discount > amountDue + fine) {
    throw new HttpError(400, "Discount cannot exceed the amount due plus fine");
  }
  if (netAmountDue(amountDue, discount, fine) < Number(fee.amountPaid)) {
    throw new HttpError(400, "Amount due cannot be less than the amount already paid");
  }

  const updated = await prisma.memberFee.update({
    where: { memberFeeId: id },
    data: {
      ...(data.amountDue !== undefined ? { amountDue: data.amountDue } : {}),
      ...(data.discount !== undefined ? { discount: data.discount } : {}),
      ...(data.fine !== undefined ? { fine: data.fine } : {}),
      ...(data.dueDate !== undefined ? { dueDate: new Date(data.dueDate) } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });

  await writeAudit(
    actorId,
    "UPDATE_MEMBER_FEE",
    updated.memberFeeId,
    `Updated member fee ${updated.memberFeeId}`,
    ipAddress,
    "member_fees",
  );
  return toMemberFeeDto(updated);
}

export async function updateMemberFeeStatus(
  actorId: number,
  id: number,
  status: FeeStatus,
  ipAddress?: string,
): Promise<MemberFeeDto> {
  const fee = await prisma.memberFee.findUnique({ where: { memberFeeId: id } });
  if (!fee) throw new HttpError(404, "Member fee not found");

  const updated = await prisma.memberFee.update({
    where: { memberFeeId: id },
    data: { status },
  });

  await writeAudit(
    actorId,
    "UPDATE_MEMBER_FEE_STATUS",
    updated.memberFeeId,
    `Set member fee status to ${status}`,
    ipAddress,
    "member_fees",
  );
  return toMemberFeeDto(updated);
}

export async function listFeePayments(): Promise<FeePaymentDto[]> {
  const payments = await prisma.feePayment.findMany({ orderBy: { paymentId: "asc" } });
  return payments.map(toFeePaymentDto);
}

export async function getFeePayment(id: number): Promise<FeePaymentDto> {
  const payment = await prisma.feePayment.findUnique({ where: { paymentId: id } });
  if (!payment) throw new HttpError(404, "Fee payment not found");
  return toFeePaymentDto(payment);
}

export async function createFeePayment(
  actorId: number,
  data: CreateFeePaymentRequest,
  ipAddress?: string,
): Promise<FeePaymentDto> {
  const payment = await prisma.$transaction(async (tx) => {
    const memberFee = await tx.memberFee.findUnique({
      where: { memberFeeId: data.memberFeeId },
    });
    if (!memberFee) throw new HttpError(404, "Member fee not found");
    if (memberFee.status === "CANCELLED") {
      throw new HttpError(409, "Cannot record a payment for a cancelled fee");
    }

    const receiptExists = await tx.feePayment.findUnique({
      where: { receiptNumber: data.receiptNumber },
    });
    if (receiptExists) throw new HttpError(409, "Receipt number already exists");

    const amountPaid = Number(memberFee.amountPaid);
    const totalDue = netAmountDue(
      Number(memberFee.amountDue),
      Number(memberFee.discount),
      Number(memberFee.fine),
    );
    const outstanding = roundMoney(totalDue - amountPaid);
    if (outstanding <= 0) {
      throw new HttpError(409, "This fee has already been fully paid");
    }
    if (data.amount > outstanding) {
      throw new HttpError(
        400,
        `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`,
      );
    }

    const newAmountPaid = roundMoney(amountPaid + data.amount);
    const newStatus: FeeStatus = newAmountPaid >= totalDue ? "PAID" : "PARTIAL";

    const created = await tx.feePayment.create({
      data: {
        memberFeeId: data.memberFeeId,
        receiptNumber: data.receiptNumber,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        referenceNumber: data.referenceNumber ?? null,
        receivedBy: actorId,
        remarks: data.remarks ?? null,
      },
    });

    const updated = await tx.memberFee.updateMany({
      where: { memberFeeId: data.memberFeeId, amountPaid: memberFee.amountPaid },
      data: {
        amountPaid: newAmountPaid,
        status: newStatus,
      },
    });
    if (updated.count === 0) {
      throw new HttpError(409, "Fee was updated concurrently, please retry");
    }

    return created;
  });

  await writeAudit(
    actorId,
    "CREATE_FEE_PAYMENT",
    payment.paymentId,
    `Recorded payment ${payment.receiptNumber}`,
    ipAddress,
    "fee_payments",
  );

  return toFeePaymentDto(payment);
}
