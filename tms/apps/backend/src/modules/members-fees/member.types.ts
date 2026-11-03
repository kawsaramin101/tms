import type { MemberDto, MemberFeeDto, FeeTypeDto, FeePaymentDto } from "@tms/contracts";
import type { Member, FeeType, MemberFee, FeePayment } from "@prisma/client";

export function toMemberDto(m: Member): MemberDto {
  return {
    memberId: m.memberId,
    memberCode: m.memberCode,
    name: m.name,
    memberType: m.memberType,
    department: m.department,
    phone: m.phone,
    email: m.email,
    address: m.address,
    status: m.status as MemberDto["status"],
    createdAt: m.createdAt.toISOString(),
  };
}

export function toFeeTypeDto(f: FeeType): FeeTypeDto {
  return {
    feeTypeId: f.feeTypeId,
    feeName: f.feeName,
    defaultAmount: Number(f.defaultAmount),
    description: f.description,
    status: f.status as FeeTypeDto["status"],
  };
}

export function toMemberFeeDto(mf: MemberFee): MemberFeeDto {
  return {
    memberFeeId: mf.memberFeeId,
    memberId: mf.memberId,
    feeTypeId: mf.feeTypeId,
    amountDue: Number(mf.amountDue),
    amountPaid: Number(mf.amountPaid),
    discount: Number(mf.discount),
    fine: Number(mf.fine),
    dueDate: (mf.dueDate instanceof Date ? mf.dueDate.toISOString().split("T")[0] : String(mf.dueDate)) as string,
    status: mf.status as MemberFeeDto["status"],
    createdAt: mf.createdAt.toISOString(),
  };
}

export function toFeePaymentDto(fp: FeePayment): FeePaymentDto {
  return {
    paymentId: fp.paymentId,
    memberFeeId: fp.memberFeeId,
    receiptNumber: fp.receiptNumber,
    amount: Number(fp.amount),
    paymentMethod: fp.paymentMethod as FeePaymentDto["paymentMethod"],
    paymentDate: fp.paymentDate.toISOString(),
    referenceNumber: fp.referenceNumber,
    receivedBy: fp.receivedBy,
    remarks: fp.remarks,
  };
}
