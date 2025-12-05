// backend-app/src/utils/emiCalculator.js

function calculateEmi(principalRaw, annualRatePercentRaw, tenureMonthsRaw) {
  const principal = Number(principalRaw);
  const annualRatePercent = Number(annualRatePercentRaw);
  const tenureMonths = Number(tenureMonthsRaw);

  if (!principal || !tenureMonths) {
    throw new Error("Invalid principal or tenure for EMI calc");
  }

  const monthlyRate = annualRatePercent / (12 * 100);

  if (monthlyRate === 0) {
    const emi = principal / tenureMonths;
    const totalPayable = emi * tenureMonths;
    const totalInterest = totalPayable - principal;

    return {
      emi,
      totalPayable,
      totalInterest,
    };
  }

  const rPowN = Math.pow(1 + monthlyRate, tenureMonths);
  const emi =
    (principal * monthlyRate * rPowN) / (rPowN - 1);

  const totalPayable = emi * tenureMonths;
  const totalInterest = totalPayable - principal;

  return {
    emi,
    totalPayable,
    totalInterest,
  };
}

module.exports = { calculateEmi };
