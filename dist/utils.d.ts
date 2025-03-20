import { RawArgsArray, Call, RawArgs } from "starknet";
import { RequestedMethod, SpendingLimit, GasSponsoredSessionTransactionRequest } from "./types";
declare const getAllowedMethodCalldata: (requestedMethods: RequestedMethod[], version?: "v1" | "v2") => RawArgsArray;
declare const getAllowedMethodHintsCalldata: (requestedMethods: RequestedMethod[], calls: Call[]) => RawArgsArray;
declare const getSpendingLimitCalldata: (spendingLimits: SpendingLimit[]) => RawArgsArray;
declare const getCallDataValidationCalldata: (requestedMethods: RequestedMethod[]) => RawArgsArray;
declare const getCalldata: (request: GasSponsoredSessionTransactionRequest, version?: "v1" | "v2") => RawArgs;
export { getAllowedMethodCalldata, getAllowedMethodHintsCalldata, getSpendingLimitCalldata, getCalldata, getCallDataValidationCalldata, };
