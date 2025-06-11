import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function ToastDemo() {
    const showSuccessToast = () => {
        toast.success('🎉 Opération réussie !', {
            description: 'Le toast de succès fonctionne parfaitement.',
            duration: 4000,
        });
    };

    const showErrorToast = () => {
        toast.error('❌ Erreur détectée !', {
            description: 'Ceci est un exemple de toast d\'erreur.',
            duration: 5000,
        });
    };

    const showWarningToast = () => {
        toast.warning('⚠️ Attention !', {
            description: 'Ceci est un avertissement important.',
            duration: 4000,
        });
    };

    const showInfoToast = () => {
        toast.info('ℹ️ Information', {
            description: 'Toast d\'information avec des détails utiles.',
            duration: 3000,
        });
    };

    const showPromiseToast = () => {
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve({ data: 'Données chargées' }), 2000);
        });

        toast.promise(promise, {
            loading: '⏳ Chargement en cours...',
            success: (data: any) => `✅ ${data.data} avec succès !`,
            error: '❌ Échec du chargement',
        });
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>🍞 Démonstration des Toasts Sonner</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button
                        onClick={showSuccessToast}
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                    >
                        Toast Succès
                    </Button>

                    <Button
                        onClick={showErrorToast}
                        variant="destructive"
                    >
                        Toast Erreur
                    </Button>

                    <Button
                        onClick={showWarningToast}
                        variant="outline"
                        className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                        Toast Warning
                    </Button>

                    <Button
                        onClick={showInfoToast}
                        variant="outline"
                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                        Toast Info
                    </Button>

                    <Button
                        onClick={showPromiseToast}
                        variant="secondary"
                        className="md:col-span-2"
                    >
                        Toast Promise
                    </Button>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">💡 Instructions :</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Testez les différents types de toasts manuels ci-dessus</li>
                        <li>• Les toasts de session apparaissent automatiquement lors des actions CRUD</li>
                        <li>• Essayez de modifier un client pour voir le toast de mise à jour</li>
                        <li>• Les toasts sont positionnés en haut à droite et peuvent être fermés</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}
