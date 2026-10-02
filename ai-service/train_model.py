import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torchvision.models import EfficientNet_B0_Weights
from torch.utils.data import DataLoader
from tqdm import tqdm
import os

# Setup Hardware Acceleration
device = torch.device("mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Initializing Training Engine on: {device}")

# Preprocessing & Augmentation (EfficientNet expects 224x224)
train_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(10),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Validation transforms should NEVER have random augmentations (flips, rotations)
val_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

data_dir = 'dataset'
train_data = datasets.ImageFolder(os.path.join(data_dir, 'train'), transform=train_transforms)
val_data = datasets.ImageFolder(os.path.join(data_dir, 'val'), transform=val_transforms) 

train_loader = DataLoader(train_data, batch_size=32, shuffle=True)
val_loader = DataLoader(val_data, batch_size=32, shuffle=False)

# Get dynamic class names from the folder structure
class_names = train_data.classes


class_weights = torch.tensor([3.0, 1.0]).to(device)
criterion = nn.CrossEntropyLoss(weight=class_weights)


print("🧠 Loading EfficientNet-B0 backbone...")
model = models.efficientnet_b0(weights=EfficientNet_B0_Weights.DEFAULT)


for param in model.parameters():
    param.requires_grad = False


num_ftrs = model.classifier[1].in_features
model.classifier[1] = nn.Linear(num_ftrs, len(class_names))
model = model.to(device)


optimizer = optim.Adam(model.classifier.parameters(), lr=0.001)

epochs = 5
best_val_acc = 0.0

print(f"🔥 Starting Training for {epochs} Epochs...")

for epoch in range(epochs):
    # --- TRAINING PHASE ---
    model.train()
    running_loss = 0.0
    
    progress_bar = tqdm(train_loader, desc=f"Epoch {epoch+1}/{epochs} [TRAIN]")
    for inputs, labels in progress_bar:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        progress_bar.set_postfix(loss=loss.item())
        
    train_loss = running_loss / len(train_loader)

    # --- VALIDATION PHASE ---
    model.eval()
    val_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for inputs, labels in tqdm(val_loader, desc=f"Epoch {epoch+1}/{epochs} [VAL]"):
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            val_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
            
    val_acc = 100 * correct / total
    val_loss = val_loss / len(val_loader)
    
    print(f"📊 Epoch {epoch+1}: Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.2f}%")

    
    if val_acc > best_val_acc:
        best_val_acc = val_acc
        print(f"⭐ New best validation accuracy! Saving checkpoint...")
        checkpoint = {
            'epoch': epoch + 1,
            'state_dict': model.state_dict(),
            'class_names': class_names,
            'best_val_acc': best_val_acc,
            'architecture': 'efficientnet_b0'
        }
        torch.save(checkpoint, 'mediflow_lungs_best.pth')

print(f"✅ Training Complete! Best Validation Accuracy deployed: {best_val_acc:.2f}%")