import { HttpContextToken } from '@angular/common/http';

export const REPORT_ONLY = new HttpContextToken<boolean>(() => false);
