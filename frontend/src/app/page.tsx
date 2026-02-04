import { redirect } from 'next/navigation';
import { i18nConfig } from '@/i18n/config';

export default function RootPage() {
  redirect(`/${i18nConfig.defaultLocale}`);
}
