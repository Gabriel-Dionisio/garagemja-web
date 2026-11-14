export const formatSafeText = (value: string): string => value.replace(/[<>"`\p{Cc}]/gu, '');
