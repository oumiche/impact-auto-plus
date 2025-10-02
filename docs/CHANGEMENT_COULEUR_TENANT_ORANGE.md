# Changement de couleur du tenant en orange

## Modification appliquée

### CSS (`dist/css/impact-auto.css`)

**Avant :**
```css
.tenant-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--accent-color);
    opacity: 1;
}
```

**Après :**
```css
.tenant-name {
    font-size: 0.9rem;
    font-weight: 600;
    color: #ff8c00;
    opacity: 1;
}
```

## Changement effectué

- **Couleur** : Changée de l'or (#ffd700) vers l'orange (#ff8c00)
- **Visibilité** : L'orange offre un meilleur contraste sur l'arrière-plan bleu de la sidebar
- **Cohérence** : Maintient la visibilité tout en utilisant une couleur plus chaude

## Résultat

✅ Le nom du tenant "Impact Auto Demo" s'affiche maintenant en orange
✅ Meilleure visibilité et contraste
✅ Couleur plus chaude et accueillante
