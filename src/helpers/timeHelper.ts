export const buildDateFilter = (endTime: string) => {
  const specifiedDate = new Date(endTime);
  if (isNaN(specifiedDate.getTime())) return null;

  const startOfDay = new Date(
    specifiedDate.getFullYear(),
    specifiedDate.getMonth(),
    specifiedDate.getDate()
  );
  const endOfDay = new Date(
    specifiedDate.getFullYear(),
    specifiedDate.getMonth(),
    specifiedDate.getDate(),
    23,
    59,
    59,
    999
  );

  return {
    endTime: {
      $gte: startOfDay.toISOString(),
      $lte: endOfDay.toISOString(),
    },
  };
};
