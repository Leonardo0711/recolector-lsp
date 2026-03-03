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
                        title: '¡Bienvenido a DataCollect LSP!',
                        description: 'Aquí podrás grabar señas para ayudar a construir la inteligencia artificial. Te daremos un recorrido rápido por la interfaz.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '#perfilInput',
                    popover: {
                        title: '1. Tu Perfil',
                        description: 'Ingresa tu nombre, código o alias. Esto nos ayuda a organizar los videos. Haz clic en el candado para guardarlo en este navegador.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#tipoToggle',
                    popover: {
                        title: '2. ¿Palabra u Oración?',
                        description: 'Indica si grabarás una seña para una sola palabra o una frase/oración completa.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#palabraInput',
                    popover: {
                        title: '3. Texto a grabar',
                        description: 'Escribe exactamente qué palabra u oración vas a realizar frente a la cámara.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '.controls-card',
                    popover: {
                        title: '4. Grabación',
                        description: 'Enciende la cámara, ubícate en el centro, presiona "Grabar Seña", realiza tu movimiento y detenlo. El video se subirá de forma automática.',
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
        // Verificar si es la primera vez que entra a la App
        const hasSeenTour = localStorage.getItem('lsp_tour_seen');
        if (!hasSeenTour || force) {
            this.startTour();
            localStorage.setItem('lsp_tour_seen', 'true');
        }
    }
}

export default new TourManager();
