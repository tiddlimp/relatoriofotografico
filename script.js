const { jsPDF } = window.jspdf;
let images = [];
const headerImage = "Imagem1.jpg"; // Certifique-se de que esta imagem existe no seu projeto
let periodo = "TARDE"; // Valor padrão para o período

document.getElementById("fileUpload").addEventListener("change", (event) => {
    const files = event.target.files;
    for (let file of files) {
        const imgUrl = URL.createObjectURL(file);
        images.push({ url: imgUrl, description: "" });
        renderImages();
    }
});

// Função para permitir o arrastar e soltar de imagens
function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    document.getElementById("imageContainer").classList.add("drag-over");
}

function handleDragLeave(event) {
    event.preventDefault();
    document.getElementById("imageContainer").classList.remove("drag-over");
}

function handleDrop(event) {
    event.preventDefault();
    document.getElementById("imageContainer").classList.remove("drag-over");

    const files = event.dataTransfer.files;
    for (let file of files) {
        if (file.type.startsWith("image/")) {
            const imgUrl = URL.createObjectURL(file);
            images.push({ url: imgUrl, description: "" });
            renderImages();
        }
    }
}

// Adiciona os listeners para o arrastar e soltar
document.getElementById("imageContainer").addEventListener("dragover", handleDragOver);
document.getElementById("imageContainer").addEventListener("dragleave", handleDragLeave);
document.getElementById("imageContainer").addEventListener("drop", handleDrop);

function renderImages() {
    const container = document.getElementById("imageContainer");
    container.innerHTML = "";
    images.forEach((img, index) => {
        const imgElement = document.createElement("img");
        imgElement.src = img.url;
        imgElement.draggable = true;
        imgElement.dataset.index = index;
        imgElement.addEventListener("dragstart", dragStart);
        imgElement.addEventListener("dragover", dragOver);
        imgElement.addEventListener("drop", drop);
        imgElement.addEventListener("click", () => openModal(img.url));

        const descriptionInput = document.createElement("input");
        descriptionInput.type = "text";
        descriptionInput.placeholder = "Descrição da imagem";
        descriptionInput.value = img.description;
        descriptionInput.addEventListener("input", (e) => {
            images[index].description = e.target.value;
        });

        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-times-circle delete-icon";
        deleteIcon.addEventListener("click", () => deleteImage(index));

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "image-wrapper";
        imageWrapper.appendChild(deleteIcon);
        imageWrapper.appendChild(imgElement);
        imageWrapper.appendChild(descriptionInput);

        container.appendChild(imageWrapper);
    });
}

function deleteImage(index) {
    images.splice(index, 1);
    renderImages();
    showAlert("Imagem removida com sucesso!", "success");
}

function dragStart(event) {
    event.dataTransfer.setData("text/plain", event.target.dataset.index);
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const draggedIndex = event.dataTransfer.getData("text/plain");
    const targetIndex = event.target.dataset.index;
    if (draggedIndex !== targetIndex) {
        const movedImage = images.splice(draggedIndex, 1)[0];
        images.splice(targetIndex, 0, movedImage);
        renderImages();
    }
}

function clearImages() {
    images = [];
    renderImages();
    showAlert("Imagens limpas com sucesso!", "success");
}

function showLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.classList.add("active");
}

function hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    overlay.classList.remove("active");
}

function updateProgress(progress) {
    const progressBar = document.getElementById("progress");
    progressBar.style.width = `${progress}%`;
}

function openModal(imageUrl) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImg.src = imageUrl;
}

function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.style.display = "none";
}

function exportToPDF() {
    if (images.length === 0) {
        showAlert("Por favor, adicione imagens antes de exportar o relatório.", "error");
        return;
    }

    if (!reportDate) {
        showAlert("Por favor, defina a data do relatório antes de exportar.", "error");
        return;
    }

    showLoadingOverlay();
    let progress = 0;
    const totalSteps = images.length + 1; // +1 para o cabeçalho e rodapé

    const generatePDF = () => {
        const doc = new jsPDF({ orientation: "portrait", unit: "cm", format: [21, 29.7] });
        let positions = [
            { x: 2, y: 8.5 }, { x: 8, y: 8.5 }, { x: 14, y: 8.5 },
            { x: 5, y: 17.5 }, { x: 11, y: 17.5 }
        ];
        let indexOnPage = 0;
        let currentPoint = 1;

        const addHeader = (doc) => {
            doc.addImage(headerImage, "JPEG", 2, 1, 17, 4);
        };

        const addTitle = (doc, pointNumber, title) => {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            const pageWidth = 21; // Largura da página em cm
            const textX = pageWidth / 2; // Centraliza horizontalmente
            doc.text("A/C Secretária de Serviços Urbanos – SESURB", textX, 6, { align: "center" });
            doc.text(`RELATÓRIO FOTOGRÁFICO DE LIMPEZA PERÍODO DA ${periodo}`, textX, 7, { align: "center" });
            doc.text(`PONTO ${String(pointNumber).padStart(2, '0')}`, textX, 8, { align: "center" });
            doc.text(title, textX, 9, { align: "center" });
        };

        const addFooter = (doc) => {
            doc.setFontSize(7.8);
            const pageWidth = 21; // Largura da página em cm
            const footerY = 28.0; // Posição Y do rodapé
            doc.text("Rua Cidade de Santos, n° 130 - Galpão - Boqueirão - Praia Grande - SP / CEP 11.701-280", pageWidth / 2, footerY, { align: "center" });
            doc.text("Telefones: (13) 3491-5050 / 3473-8292 – Celular: (13) 9.9600-7426 / 9.7412-9532", pageWidth / 2, footerY + 0.7, { align: "center" });
        };

        const addThirdPageContent = (doc) => {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const pageWidth = 21; // Largura da página em cm
            const textX = pageWidth / 2; // Centraliza horizontalmente
        };

        for (let i = 0; i < images.length; i++) {
            if (indexOnPage === 0) {
                addHeader(doc);
                addTitle(doc, currentPoint, "FOTOS DO ANTES");
            } else if (indexOnPage === 5) {
                addFooter(doc); // Adiciona o rodapé antes de criar uma nova página
                doc.addPage();
                addHeader(doc);
                addTitle(doc, currentPoint, "FOTOS DO DEPOIS");
            } else if (indexOnPage === 10) {
                addFooter(doc); // Adiciona o rodapé antes de criar uma nova página
                doc.addPage();
                addHeader(doc);
                addTitle(doc, currentPoint, "SUCÇÃO");
                addThirdPageContent(doc); // Adiciona o conteúdo específico da terceira página
            }

            if (indexOnPage < 10) {
                // Adiciona 5 fotos nas duas primeiras páginas
                let pos = positions[indexOnPage % 5];
                doc.addImage(images[i].url, "JPEG", pos.x, pos.y, 5.02, 8.93);
            } else if (indexOnPage >= 10 && indexOnPage < 12) {
                // Adiciona 2 fotos na terceira página (uma abaixo da outra)
                const x = (21 - 10.94) / 2; // Centraliza horizontalmente

                if (indexOnPage === 10) {
                    // Primeira foto da terceira página: 10,94 cm de largura e 7,3 cm de altura
                    doc.addImage(images[i].url, "JPEG", x, 10, 10.94, 7.3); // Subiu para y = 10 cm
                } else if (indexOnPage === 11) {
                    // Segunda foto da terceira página: 5,02 cm de largura e 8,93 cm de altura
                    doc.addImage(images[i].url, "JPEG", (21 - 5.02) / 2, 18, 5.02, 8.93); // Subiu para y = 18 cm
                }
            }

            indexOnPage++;
            progress = ((i + 1) / totalSteps) * 100;
            updateProgress(progress);

            // Se o grupo atual terminou (12 imagens), reinicia os contadores e pula para a próxima página
            if (indexOnPage === 12) {
                addFooter(doc); // Adiciona o rodapé ao final do ponto
                doc.addPage(); // Pula para a próxima página
                indexOnPage = 0;
                currentPoint++;
            }
        }

        // Garante que o rodapé seja adicionado apenas na última página antes da 31ª
        addFooter(doc);

        // Adiciona apenas a 31ª página com o texto definido, cabeçalho e rodapé
        if (doc.internal.getNumberOfPages() < 31) {
            doc.addPage(); // Garante que será exatamente a página 31
        }

        addHeader(doc); // Adiciona o cabeçalho
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");

        const pageWidth = 21; // Largura da página em cm
        const textX = pageWidth / 2; // Centraliza horizontalmente
        const lineHeight = 1.5; // Espaçamento entre as linhas

        const textLines = [
            "Comunicamos que estão sendo realizadas as limpezas diárias e manutenções",
            "necessárias para suprimir a alta demanda.",
            "",
            reportDate, // Usa a data definida pelo usuário
            "",
            "BG LOCAÇÕES LTDA",
            "CNPJ 19.300.503/0001-00"
        ];

        let yPosition = 10; // Posição Y inicial para o texto

        textLines.forEach(line => {
            doc.text(line, textX, yPosition, { align: "center" });
            yPosition += lineHeight;
        });

        doc.save("Relatorio_Fotografico.pdf");

        hideLoadingOverlay();
    };

    setTimeout(generatePDF, 1000); // Simula um tempo de carregamento de 1 segundo
}

let reportDate = ""; // Variável global para armazenar a data do relatório

// Função para definir a data do relatório
function setReportDate() {
    const dateInput = document.getElementById("dateInput").value;
    if (dateInput) {
        const [year, month, day] = dateInput.split("-"); // Pegamos os valores diretamente do input
        reportDate = `Praia Grande, ${day} de ${getMonthName(month)} de ${year}`;
        showAlert("Data definida com sucesso!", "success");
    } else {
        showAlert("Por favor, selecione uma data.", "error");
    }
}

// Função para obter o nome do mês
function getMonthName(month) {
    const months = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    return months[parseInt(month) - 1];
}

// Função para definir o período (MANHÃ ou TARDE)
function setPeriodo(periodoSelecionado) {
    periodo = periodoSelecionado;
    showAlert(`Período definido como: ${periodo}`, "success");
}

// Função para exibir alertas personalizados
function showAlert(message, type) {
    const alertBox = document.createElement("div");
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;

    document.body.appendChild(alertBox);

    setTimeout(() => {
        alertBox.remove();
    }, 3000);
}