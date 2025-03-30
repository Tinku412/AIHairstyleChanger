// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const removeWatermarkBtn = document.getElementById('removeWatermarkBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultContainer = document.getElementById('resultContainer');
const originalImage = document.getElementById('originalImage');
const processedImage = document.getElementById('processedImage');
const downloadBtn = document.getElementById('downloadBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const errorMessage = document.getElementById('errorMessage');
const analysisContainer = document.getElementById('analysisContainer');
const analysisText = document.getElementById('analysisText');
const exampleImages = document.getElementById('exampleImages');

// Handle file upload via drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('active');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('active');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('active');
    
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Handle file upload via click
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
    }
});

// Handle the selected file
function handleFile(file) {
    if (!file.type.match('image.*')) {
        showError('Please select an image file.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        imagePreview.style.display = 'block';
        resultContainer.style.display = 'none';
        analysisContainer.style.display = 'none';
        errorMessage.style.display = 'none';
        
        // Hide example images when a user uploads their own image
        exampleImages.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

// Remove watermark button click handler
removeWatermarkBtn.addEventListener('click', processImage);

// Try Again button click handler
tryAgainBtn.addEventListener('click', () => {
    // Show the image preview and hide the results
    imagePreview.style.display = 'block';
    resultContainer.style.display = 'none';
    analysisContainer.style.display = 'none';
    
    // Keep example images hidden
    exampleImages.style.display = 'none';
    
    // Process the image
    processImage();
});

// Add event listeners to update the hairstyle preview
document.querySelectorAll('#lengthSelect, #styleSelect, #colorSelect').forEach(select => {
    select.addEventListener('change', updateHairstylePreview);
});

// Function to update the hairstyle preview text
function updateHairstylePreview() {
    const length = document.getElementById('lengthSelect').value;
    const style = document.getElementById('styleSelect').value;
    const color = document.getElementById('colorSelect').value;
    
    let previewParts = [];
    if (length) previewParts.push(length);
    if (color) previewParts.push(color);
    if (style) previewParts.push(style);
    
    const previewText = previewParts.length > 0 ? previewParts.join(' ') : 'Select at least one option';
    document.getElementById('hairstylePreview').textContent = previewText;
    
    // Enable/disable the generate button based on selection
    const hasSelection = length || style || color;
    removeWatermarkBtn.disabled = !hasSelection;
    
    if (hasSelection) {
        removeWatermarkBtn.classList.remove('disabled-btn');
    } else {
        removeWatermarkBtn.classList.add('disabled-btn');
    }
}

// Function to process the image
async function processImage() {
    if (!fileInput.files.length) {
        showError('Please select an image first.');
        return;
    }
    
    const length = document.getElementById('lengthSelect').value;
    const style = document.getElementById('styleSelect').value;
    const color = document.getElementById('colorSelect').value;
    
    // Validate that at least one option is selected
    if (!length && !style && !color) {
        showError('Please select at least one hairstyle option.');
        return;
    }
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    removeWatermarkBtn.disabled = true;
    errorMessage.style.display = 'none';
    
    try {
        // Build the hairstyle description
        let hairstyleParts = [];
        if (length) hairstyleParts.push(length);
        if (color) hairstyleParts.push(color);
        if (style) hairstyleParts.push(style);
        
        const combinedHairstyle = hairstyleParts.join(' ');
        
        // Create form data for the file upload
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        formData.append('hairstyle', combinedHairstyle);
        
        // Send the image to the server for processing
        let response;
        try {
            response = await fetch('/remove-watermark', {
                method: 'POST',
                body: formData
            });
        } catch (fetchError) {
            console.error('Network error:', fetchError);
            throw new Error('Network error. Please check your connection and try again.');
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            // Special handling for rate limit errors
            if (response.status === 429) {
                throw new Error('Requests exceeded. Please try again after a minute.');
            }
            throw new Error(errorData.error || 'Failed to process image');
        }
        
        const data = await response.json();
        
        // Display results
        originalImage.src = data.originalImage;
        processedImage.src = data.processedImage;
        resultContainer.style.display = 'flex';
        
        // Display analysis if available
        if (data.analysis) {
            analysisText.textContent = data.analysis;
            analysisContainer.style.display = 'block';
        } else {
            analysisContainer.style.display = 'none';
        }
        
        // Setup download button
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = data.processedImage;
            a.download = 'new_hairstyle.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    } catch (error) {
        showError(error.message);
    } finally {
        loadingIndicator.style.display = 'none';
        removeWatermarkBtn.disabled = false;
    }
}

// Initialize the hairstyle preview on page load
document.addEventListener('DOMContentLoaded', () => {
    updateHairstylePreview();
    // Initially disable the button until a selection is made
    removeWatermarkBtn.disabled = true;
    removeWatermarkBtn.classList.add('disabled-btn');
});

// Helper function to show error messages
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
} 