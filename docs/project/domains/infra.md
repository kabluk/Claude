
## Почта verscala.com — аудит DNS 2026-08-21

Проверено прямыми DNS-запросами (не по памяти, не по документации провайдера).

**Отправка — настроена корректно, вопрос закрыт.** Resend верифицирован на
поддомене: `send.verscala.com` TXT `v=spf1 include:amazonses.com ~all` (Resend
работает поверх Amazon SES), MX `feedback-smtp.us-east-1.amazonses.com` для
возвратов, DKIM-ключ в `resend._domainkey.verscala.com`. DMARC корня —
`p=quarantine; adkim=r; aspf=r`. При мягком выравнивании и DKIM (подпись
`d=verscala.com`), и SPF (Return-Path на `send.verscala.com`) выравниваются с
`From: notify@verscala.com`, то есть письма уведомлений (D-175) уходят
аутентифицированными.

Отдельно снята ложная тревога: SPF КОРНЯ — `include:secureserver.net -all`
(инфраструктура GoDaddy), и это выглядит как противоречие с MX на Microsoft.
Противоречия нет: корневой SPF управляет отправкой С КОРНЕВОГО домена, а Resend
шлёт с поддомена со своим SPF. Менять корневой SPF ради Resend НЕ нужно —
и не стоит, `-all` там защищает корень от подделки.

**Приём — единственное неизвестное, требует владельца.** MX ведёт на
`verscala-com.mail.protection.outlook.com`, DKIM-селекторы Microsoft
(`selector1/2._domainkey` → `...netorgft21010936.w-v1.dkim.mail.microsoft`),
`autodiscover` → `autodiscover.outlook.com`, TXT-верификация
`NETORGFT21010936.onmicrosoft.com` — домен подключён к РЕАЛЬНОМУ тенанту M365
(разрешён через GoDaddy, отсюда `secureserver.net` в SPF корня). Но существует
ли ПОЧТОВЫЙ ЯЩИК `info@verscala.com` внутри тенанта — из DNS не видно
принципиально, а SMTP-проба из песочницы невозможна (наружу только HTTPS) и
всё равно неинформативна: M365 намеренно не подтверждает существование
адресата, чтобы нельзя было перебирать адреса.

Почему это важно именно сейчас: на `info@verscala.com` уходит уведомление о
КАЖДОМ лиде (D-175), а по D-174 первый реальный лид — главная веха фазы 2.
Если ящика нет, первый лид будет молча записан в D1 и никем не замечен.
