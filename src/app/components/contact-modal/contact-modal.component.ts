import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Product, ContactInfo } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

/**
 * Composant modal de contact avec formulaire
 */
@Component({
    selector: 'app-contact-modal',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './contact-modal.component.html',
    styleUrls: ['./contact-modal.component.scss']
})
export class ContactModalComponent implements OnInit, OnChanges {
  /** Produit sélectionné (optionnel) */
  @Input() product?: Product;

  /** État d'ouverture du modal */
  @Input() isOpen = false;

  /** Événement de fermeture du modal */
  @Output() closeModal = new EventEmitter<void>();

  /** Formulaire de contact */
  contactForm!: FormGroup;

  /** Informations de contact de la boutique */
  contactInfo!: ContactInfo;

  /** État de copie du numéro WhatsApp */
  whatsappCopied = false;

  /** État d'animation du modal */
  isAnimating = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.contactInfo = this.productService.getContactInfo();
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.isAnimating = true;
        document.body.style.overflow = 'hidden';
        this.updateFormMessage();
      } else {
        document.body.style.overflow = 'auto';
      }
    }

    if (changes['product'] && this.contactForm) {
      this.updateFormMessage();
    }
  }

  /**
   * Initialise le formulaire de contact
   */
  initForm(): void {
    this.contactForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9\s\+\-\(\)]{10,}$/)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /**
   * Met à jour le message du formulaire avec le produit
   */
  updateFormMessage(): void {
    if (this.product && this.contactForm) {
      const message = `Bonjour,\n\nJe suis intéressé(e) par le produit "${this.product.nom}" (${this.product.prix}€).\n\nPouvez-vous me donner plus d'informations ?\n\nMerci.`;
      this.contactForm.patchValue({ message });
    }
  }

  /**
   * Ferme le modal
   */
  close(): void {
    this.isAnimating = false;
    setTimeout(() => {
      this.closeModal.emit();
      this.contactForm.reset();
      document.body.style.overflow = 'auto';
    }, 300);
  }

  /**
   * Gère le clic sur l'overlay
   */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  /**
   * Copie le numéro WhatsApp dans le presse-papiers
   */
  copyWhatsApp(): void {
    navigator.clipboard.writeText(this.contactInfo.whatsapp).then(() => {
      this.whatsappCopied = true;
      setTimeout(() => {
        this.whatsappCopied = false;
      }, 2000);
    });
  }

  /**
   * Ouvre WhatsApp avec message pré-rempli
   */
  openWhatsApp(): void {
    const message = this.contactForm.value.message || 'Bonjour,';
    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = this.contactInfo.whatsapp.replace(/\s/g, '');
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  }

  /**
   * Ouvre le client email avec les informations pré-remplies
   */
  sendEmail(): void {
    const { nom, email, telephone, message } = this.contactForm.value;
    const subject = this.product
      ? `Demande d'information - ${this.product.nom}`
      : 'Demande d\'information';

    const body = `Nom: ${nom}\nEmail: ${email}\nTéléphone: ${telephone}\n\nMessage:\n${message}`;
    const mailtoLink = `mailto:${this.contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;
  }

  /**
   * Appelle le numéro de téléphone
   */
  callPhone(): void {
    window.location.href = `tel:${this.contactInfo.telephone}`;
  }

  /**
   * Vérifie si un champ est invalide et touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Retourne le message d'erreur pour un champ
   */
  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return 'Ce champ est requis';
    }
    if (field.hasError('email')) {
      return 'Email invalide';
    }
    if (field.hasError('minLength')) {
      return `Minimum ${field.getError('minLength').requiredLength} caractères`;
    }
    if (field.hasError('pattern')) {
      return 'Format invalide';
    }
    return '';
  }
}
