
import AdminRoute from "@/components/admin/admin-route";
import LinkAccountSettings from "@/components/admin/link-account-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/language-provider";

export default function AdminPaymentSettingsPage() {
    const { t } = useTranslation();
    return (
        <AdminRoute>
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-8 max-w-2xl mx-auto">
                    <Card className="shadow-lg border-border/20">
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">{t('link_account_page_title')}</CardTitle>
                            <CardDescription>{t('link_account_page_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <LinkAccountSettings />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminRoute>
    );
}
