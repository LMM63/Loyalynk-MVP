'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface LoyaltyCard {
  _id: string;
  name: string;
  logo: string;
  color: string;
  totalVisits: number;
  currentVisits: number;
  rewardRedeemed: boolean;
  lastRedeemedAt?: Date;
  redemptionHistory: Array<{
    redeemedAt: Date;
    visitsAtRedemption: number;
  }>;
  qrCode: string;
}

export default function Dashboard() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    color: '#000000',
    totalVisits: 10,
  });
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Fetch cards
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/cards', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data = await res.json();
      setCards(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to create card');
      }

      const newCard = await res.json();
      setCards([...cards, newCard]);
      setShowForm(false);
      setFormData({
        name: '',
        logo: '',
        color: '#000000',
        totalVisits: 10,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStamp = async (cardId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/cards/${cardId}/stamp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to stamp card');
      }

      const updatedCard = await res.json();
      setCards(cards.map(card => 
        card._id === cardId ? updatedCard : card
      ));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRedeem = async (cardId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/cards/${cardId}/redeem`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to redeem reward');
      }

      const updatedCard = await res.json();
      setCards(cards.map(card => 
        card._id === cardId ? updatedCard : card
      ));
      setShowRedeemModal(false);
      setSelectedCard(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const renderStamps = (current: number, total: number) => {
    const stamps = [];
    for (let i = 0; i < total; i++) {
      stamps.push(
        <div
          key={i}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            i < current
              ? 'bg-green-500 border-green-600'
              : 'bg-gray-100 border-gray-300'
          }`}
        >
          {i < current ? '✓' : ''}
        </div>
      );
    }
    return stamps;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Loyalty Cards</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {showForm ? 'Cancel' : 'Create New Card'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Logo URL</label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Card Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1 block w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Visits Required</label>
                  <input
                    type="number"
                    value={formData.totalVisits}
                    onChange={(e) => setFormData({ ...formData, totalVisits: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-gray-900"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Create Card
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card._id}
                className="bg-white overflow-hidden shadow rounded-lg"
                style={{ borderColor: card.color, borderWidth: '2px' }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{card.name}</h3>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleStamp(card._id)}
                        disabled={card.currentVisits >= card.totalVisits}
                        className="ml-2 bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                      >
                        Stamp
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{card.currentVisits}/{card.totalVisits}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {renderStamps(card.currentVisits, card.totalVisits)}
                    </div>
                  </div>

                  {card.currentVisits >= card.totalVisits && (
                    <div className="mt-4">
                      <button
                        onClick={() => {
                          setSelectedCard(card);
                          setShowRedeemModal(true);
                        }}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Reward Available! Tap to Redeem
                      </button>
                    </div>
                  )}

                  {card.redemptionHistory && card.redemptionHistory.length > 0 && (
                    <div className="mt-4 text-center text-sm text-gray-500">
                      Last redeemed: {new Date(card.lastRedeemedAt!).toLocaleDateString()}
                      <br />
                      <span className="text-xs">
                        Total rewards earned: {card.redemptionHistory.length}
                      </span>
                    </div>
                  )}

                  {card.logo && (
                    <div className="mt-4">
                      <Image
                        src={card.logo}
                        alt={`${card.name} logo`}
                        width={100}
                        height={100}
                        className="rounded-full"
                      />
                    </div>
                  )}
                  {card.qrCode && (
                    <div className="mt-4">
                      <Image
                        src={card.qrCode}
                        alt="QR Code"
                        width={200}
                        height={200}
                        className="mx-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && selectedCard && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Redeem Reward</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to redeem the reward for {selectedCard.name}? This will reset the stamps to 0.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowRedeemModal(false);
                  setSelectedCard(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRedeem(selectedCard._id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 