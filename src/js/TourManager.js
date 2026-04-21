import { driver } from 'driver.js';

class TourManager {
    constructor() {
        this.driverObj = null;
        this.initDriver();
    }

    initDriver() {
        this.driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: '¡Entendido!',
            closeBtnText: 'Cerrar',
            nextBtnText: 'Siguiente &rarr;',
            prevBtnText: '&larr; Anterior',
            progressText: 'Paso {{current}} de {{total}}',
            steps: [
                {
                    element: '#sidebar',
                    popover: {
                        title: '¡Bienvenido a Recolector LSP!',
                        description: 'Estamos recolectando un dataset profesional de Lenguaje de Señas Peruano. Este recorrido te enseñará por qué cada paso es vital.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '#participantCard',
                    popover: {
                        title: '1. Perfil del Participante',
                        description: 'Ingresa tus datos reales. Esto es fundamental para la variabilidad estadística (edad, región, mano dominante).',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#consentCard',
                    popover: {
                        title: '2. Consentimiento Ético',
                        description: 'La recolección sigue principios éticos. Debes autorizar el uso académico y de IA para continuar.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#modeSelectorCard',
                    popover: {
                        title: '3. Modo de Captura',
                        description: 'Elige entre los 4 bloques (Aislado, Expresiones, Plantillas o Continuo). Cada uno tiene un objetivo científico distinto.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#wordSelectorCard',
                    popover: {
                        title: '4. Selección de Ítem',
                        description: 'Elige la categoría y el ítem a grabar. En modos aislados realizaremos hasta 5 repeticiones; en continuo realizaremos grabaciones narrativas.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '.video-container',
                    popover: {
                        title: '4. Área de Captura',
                        description: 'Asegúrate de tener buena iluminación y que tus manos, hombros y rostro sean visibles.',
                        side: 'top',
                        align: 'start'
                    }
                },
                {
                    element: '.controls-card',
                    popover: {
                        title: '5. Calidad y Revisión',
                        description: 'Después de grabar, revisaremos el video. Si es claro y completo, podrás aceptarlo para subirlo a la nube.',
                        side: 'top',
                        align: 'start'
                    }
                }
            ]
        });
    }

    startTour() {
        if (this.driverObj) {
            this.driverObj.drive();
        }
    }

    startTourAuto(force = false) {
        const hasSeenTour = localStorage.getItem('lsp_tour_seen');
        if (!hasSeenTour || force) {
            this.startTour();
            localStorage.setItem('lsp_tour_seen', 'true');
        }
    }
}

export default new TourManager();
