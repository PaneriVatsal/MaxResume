import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
 
export const routing = defineRouting({
  locales: ['en', 'es', 'zh', 'ja', 'pt'],
  defaultLocale: 'en'
});
 
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);
