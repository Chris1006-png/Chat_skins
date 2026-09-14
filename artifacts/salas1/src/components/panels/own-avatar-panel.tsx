import { useState } from 'react';
import { Avatar } from '@workspace/api-client-react';
import { PanelBackdrop } from './panel-backdrop';
import { SpriteAvatarPreview } from '@/components/sprite-avatar-preview';

const PROFILE_HAT_SRC = `${import.meta.env.BASE_URL}assets/farmcity-cowboy-hat.png`;
const PROFILE_HORSESHOE_SRC = `${import.meta.env.BASE_URL}assets/farmcity-horseshoe.png`;

interface OwnAvatarPanelProps {
  username: string;
  avatar: Avatar;
  onClose: () => void;
  onAction: (action: string, payload?: string) => void;
}

type SubView = 'main' | 'emociones' | 'inventario';

const EMOTES = [
  { emoji: '👋', label: 'Hola' },
  { emoji: '😄', label: 'Feliz' },
  { emoji: '😂', label: 'Risa' },
  { emoji: '😍', label: 'Amor' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😠', label: 'Enojado' },
  { emoji: '🤩', label: 'Asombro' },
  { emoji: '❤️', label: 'Corazón' },
  { emoji: '🎉', label: 'Fiesta' },
  { emoji: '👍', label: 'Bien' },
  { emoji: '💀', label: 'Calaca' },
  { emoji: '🔥', label: 'Fuego' },
  { emoji: '⭐', label: 'Estrella' },
  { emoji: '💤', label: 'Dormir' },
  { emoji: '🌈', label: 'Arcoíris' },
  { emoji: '🍀', label: 'Suerte' },
];

const actionItems = [
  { id: 'change-costume', icon: '👗', label: 'Cambiar ropa' },
  { id: 'dance', icon: '💃', label: 'Bailar' },
  { id: 'emotions', icon: '😄', label: 'Emociones' },
  { id: 'sit', icon: '🪑', label: 'Sentarse' },
  { id: 'photo', icon: '📷', label: 'Fotografía' },
  { id: 'inventory', icon: '🎒', label: 'Inventario' },
  { id: 'farm', icon: '🏡', label: 'Mi Granja' },
  { id: 'settings', icon: '⚙️', label: 'Config.' },
];

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.max(0, Math.min(100, Math.round((value / max) * 100)));

  return (
    <div className="farmcity-profile-panel__bar" aria-hidden="true">
      <div
        className="farmcity-profile-panel__bar-fill"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
}

function Rivet({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`farmcity-profile-panel__rivet ${className}`} />;
}

function PanelFrame({
  title,
  onClose,
  onBack,
  children,
}: {
  title: string;
  onClose: () => void;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <PanelBackdrop onClose={onClose}>
      <section className="farmcity-profile-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="farmcity-profile-panel__corner farmcity-profile-panel__corner--tl" aria-hidden="true" />
        <div className="farmcity-profile-panel__corner farmcity-profile-panel__corner--tr" aria-hidden="true" />
        <div className="farmcity-profile-panel__corner farmcity-profile-panel__corner--bl" aria-hidden="true" />
        <div className="farmcity-profile-panel__corner farmcity-profile-panel__corner--br" aria-hidden="true" />

        <header className="farmcity-profile-panel__header">
          <img
            src={PROFILE_HAT_SRC}
            alt=""
            aria-hidden="true"
            className="farmcity-profile-panel__hat"
          />
          <Rivet className="farmcity-profile-panel__header-rivet" />
          <div className="farmcity-profile-panel__header-title">
            <span className="farmcity-profile-panel__header-star" aria-hidden="true">★</span>
            {onBack ? (
              <div className="farmcity-profile-panel__subview-title">
                <button
                  type="button"
                  onClick={onBack}
                  className="farmcity-profile-panel__back"
                  data-testid="button-profile-back"
                >
                  ‹ Volver
                </button>
                <span>{title.toUpperCase()}</span>
              </div>
            ) : (
              <span className="farmcity-profile-panel__brand">FARMCITY</span>
            )}
            <span className="farmcity-profile-panel__header-star" aria-hidden="true">★</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="farmcity-profile-panel__close-icon"
            aria-label="Cerrar panel"
            data-testid="button-profile-close"
          >
            ×
          </button>
        </header>

        {children}
      </section>
    </PanelBackdrop>
  );
}

function AvatarSprite({ avatar }: { avatar: Avatar }) {
  const hasClothing =
    avatar.shirtColor !== avatar.skinColor ||
    avatar.pantsColor !== avatar.skinColor;

  return (
    <div className="farmcity-profile-panel__avatar-frame" data-testid="img-profile-avatar">
      <div className="farmcity-profile-panel__avatar-stage">
        <SpriteAvatarPreview
          skinColor={avatar.skinColor}
          hairColor={avatar.hairColor}
          shirtColor={avatar.shirtColor}
          pantsColor={avatar.pantsColor}
          hasClothing={hasClothing}
          hairStyle={avatar.hairStyle}
          accessory={avatar.accessory}
          accessoryColor={avatar.accessoryColor}
          facing={0}
          size={74}
        />
      </div>
    </div>
  );
}

function InventoryEmpty() {
  return (
    <div className="farmcity-profile-panel__inventory-empty" data-testid="empty-profile-inventory">
      <span className="farmcity-profile-panel__inventory-icon" aria-hidden="true">🎒</span>
      <strong>Inventario vacío</strong>
      <span>Recoge objetos en el mundo para verlos aquí</span>
    </div>
  );
}

export function OwnAvatarPanel({ username, avatar, onClose, onAction }: OwnAvatarPanelProps) {
  const [view, setView] = useState<SubView>('main');
  const [isSitting, setIsSitting] = useState(false);

  const handleCambiarRopa = () => {
    onAction('change-costume');
    onClose();
  };

  const handleBailar = () => {
    onAction('dance');
    onClose();
  };

  const handleSentarse = () => {
    onAction(isSitting ? 'standup' : 'sit');
    setIsSitting((current) => !current);
    onClose();
  };

  const handleFoto = () => {
    onAction('photo');
    onClose();
  };

  const handleMiGranja = () => {
    // TODO: navigate to farm when feature exists
    alert('¡Próximamente! Tu granja estará lista pronto 🌾');
  };

  const handleEmote = (emoji: string) => {
    onAction('emote', emoji);
    onClose();
  };

  if (view === 'emociones') {
    return (
      <PanelFrame title="Emociones" onClose={onClose} onBack={() => setView('main')}>
        <div className="farmcity-profile-panel__subheading">
          <span>GESTOS DEL RANCHO</span>
          <span className="farmcity-profile-panel__subheading-rule" />
        </div>
        <div className="farmcity-profile-panel__emote-grid">
          {EMOTES.map(({ emoji, label }) => (
            <button
              type="button"
              key={emoji}
              onClick={() => handleEmote(emoji)}
              className="farmcity-profile-panel__emote"
              title={label}
              aria-label={label}
              data-testid={`button-profile-emote-${label.toLowerCase()}`}
            >
              <span aria-hidden="true">{emoji}</span>
              <small>{label}</small>
            </button>
          ))}
        </div>
      </PanelFrame>
    );
  }

  if (view === 'inventario') {
    return (
      <PanelFrame title="Inventario" onClose={onClose} onBack={() => setView('main')}>
        <div className="farmcity-profile-panel__subheading">
          <span>BOLSA DE VIAJE</span>
          <span className="farmcity-profile-panel__subheading-rule" />
        </div>
        <div className="farmcity-profile-panel__inventory">
          <InventoryEmpty />
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Perfil de avatar" onClose={onClose}>
      <div className="farmcity-profile-panel__identity">
        <AvatarSprite avatar={avatar} />
        <div className="farmcity-profile-panel__identity-copy">
          <strong data-testid="text-profile-username">{username.toUpperCase()}</strong>
          <span>Nivel <b>1</b></span>
          <span className="farmcity-profile-panel__role">🌾 Granjero</span>
        </div>
        <div className="farmcity-profile-panel__experience" data-testid="status-profile-experience">
          <span>EXP</span>
          <StatBar value={300} max={1000} color="#F2B321" />
          <b>300/1000</b>
        </div>
      </div>

      <div className="farmcity-profile-panel__stats" data-testid="status-profile-stats">
        <div className="farmcity-profile-panel__stat-row">
          <span className="farmcity-profile-panel__stat-icon" aria-hidden="true">❤️</span>
          <span className="farmcity-profile-panel__stat-label">Vida</span>
          <StatBar value={100} max={100} color="#E94B3C" />
          <b>100/100</b>
        </div>
        <div className="farmcity-profile-panel__currency-row">
          <div>
            <span className="farmcity-profile-panel__currency-icon" aria-hidden="true">🪙</span>
            <span>Oro</span>
            <b>0</b>
          </div>
          <i aria-hidden="true" />
          <div>
            <span className="farmcity-profile-panel__currency-icon" aria-hidden="true">💎</span>
            <span>Diamantes</span>
            <b>0</b>
          </div>
        </div>
      </div>

      <div className="farmcity-profile-panel__actions" data-testid="profile-action-grid">
        {actionItems.map(({ id, icon, label }) => {
          const isActiveSit = id === 'sit' && isSitting;
          const onClick = {
            'change-costume': handleCambiarRopa,
            dance: handleBailar,
            emotions: () => setView('emociones'),
            sit: handleSentarse,
            photo: handleFoto,
            inventory: () => setView('inventario'),
            farm: handleMiGranja,
            settings: () => alert('Configuración próximamente ⚙️'),
          }[id];

          return (
            <button
              type="button"
              key={id}
              onClick={onClick}
              className={`farmcity-profile-panel__action ${isActiveSit ? 'farmcity-profile-panel__action--active' : ''}`}
              data-testid={`button-profile-${id}`}
            >
              <span className="farmcity-profile-panel__action-icon" aria-hidden="true">{icon}</span>
              <span>{isActiveSit ? 'Levantarse' : label}</span>
              <Rivet className="farmcity-profile-panel__action-rivet farmcity-profile-panel__action-rivet--left" />
              <Rivet className="farmcity-profile-panel__action-rivet farmcity-profile-panel__action-rivet--right" />
            </button>
          );
        })}
      </div>

      <div className="farmcity-profile-panel__footer">
        <button
          type="button"
          onClick={onClose}
          className="farmcity-profile-panel__close-button"
          data-testid="button-profile-close-panel"
        >
          <img
            src={PROFILE_HORSESHOE_SRC}
            alt=""
            aria-hidden="true"
            className="farmcity-profile-panel__horseshoe"
          />
          Cerrar panel
        </button>
      </div>
    </PanelFrame>
  );
}