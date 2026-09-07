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
                        title: '👋 ¡Bienvenido a tu Estudio de Grabación!',
                        description: 'Gracias por colaborar en la recolección del dataset de Lenguaje de Señas Peruano (LSP). Esta breve guía te mostrará cómo grabar tus señas paso a paso.',
                        side: 'right',
                        align: 'start'
                    }
                },
                {
                    element: '#comboboxWrapper',
                    popover: {
                        title: '1. Elige la Seña a Grabar',
                        description: 'Escribe para buscar rápidamente o haz clic en la flecha para ver el listado de las 40 señas. El sistema seleccionará automáticamente las que tengas pendientes.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '#repetitionContainer',
                    popover: {
                        title: '2. Tus 10 Repeticiones',
                        description: 'Cada seña requiere 10 tomas para que la IA aprenda bien su movimiento. Los círculos se irán marcando en verde conforme avances y tu progreso se guardará automáticamente.',
                        side: 'bottom',
                        align: 'start'
                    }
                },
                {
                    element: '.controls-card',
                    popover: {
                        title: '3. Iniciar la Cámara',
                        description: 'Presiona "Iniciar Cámara" para activar tu cámara web (recuerda otorgar el permiso en tu navegador). En celular también podrás voltear la cámara.',
                        side: 'top',
                        align: 'start'
                    }
                },
                {
                    element: '#videoContainer',
                    popover: {
                        title: '4. Encuadre y Postura',
                        description: 'Ubícate frente a la cámara con buena luz. Asegúrate de que tus manos, tu rostro y tus hombros permanezcan siempre dentro del marco del video.',
                        side: 'left',
                        align: 'start'
                    }
                },
                {
                    element: '#btnRecord',
                    popover: {
                        title: '5. Grabar con Cuenta Regresiva',
                        description: 'Al pulsar "Grabar Seña", verás una cuenta regresiva de 3 segundos para alistarte. Haz la seña con naturalidad y claridad, y luego presiona "Detener".',
                        side: 'top',
                        align: 'start'
                    }
                },
                {
                    element: '#videoContainer',
                    popover: {
                        title: '6. Revisar y Subir',
                        description: 'Al terminar de grabar, se reproducirá tu video. Si quedó claro, pulsa "Aceptar y Subir"; si te equivocaste, puedes pulsar "Repetir" todas las veces que quieras.',
                        side: 'left',
                        align: 'start'
                    }
                },
                {
                    element: '#userChip',
                    popover: {
                        title: '7. Tu Perfil y Cierre de Sesión',
                        description: 'En la esquina superior puedes ver tu alias y mano dominante. Cuando termines o quieras descansar, usa el botón "Salir". ¡Podrás retomar en cualquier momento donde te quedaste!',
                        side: 'bottom',
                        align: 'end'
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
