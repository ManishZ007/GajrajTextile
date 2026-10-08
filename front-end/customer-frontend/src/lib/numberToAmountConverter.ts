export function numberToAmountConverter(amount: number) {
  const formatter = Intl.NumberFormat('en-IN', {
    currency: 'INR',
    style: 'currency',
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
}
