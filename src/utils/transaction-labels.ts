export function getTransactionLabels(isExpense: boolean) {
  return {
    entityLabel: isExpense ? "Payee (optional)" : "Source (optional)",
    entityPlaceholder: isExpense ? "Who did you pay?" : "Where did it come from?",
    descriptionPlaceholder: isExpense ? "What was it for?" : "What is this income?",
  };
}
