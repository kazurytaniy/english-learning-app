import React from 'react';
import { ArrowRight, Shuffle, X } from 'lucide-react';
import { LEARNING_MODES, LEARNING_MODE_LABELS } from '../utils/constants';

const LearningModeModal = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">学習モードを選択</h2>
        <p className="text-sm text-gray-600 mb-6">どのモードで学習しますか?</p>

        <div className="space-y-3">
          <button
            onClick={() => onSelect(LEARNING_MODES.EN_TO_JP)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl p-4 transition-all flex items-center justify-between group"
          >
            <div className="text-left">
              <div className="font-semibold text-lg">英語 → 日本語</div>
              <div className="text-sm opacity-90">英語を見て日本語を答える</div>
            </div>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onSelect(LEARNING_MODES.JP_TO_EN)}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl p-4 transition-all flex items-center justify-between group"
          >
            <div className="text-left">
              <div className="font-semibold text-lg">日本語 → 英語</div>
              <div className="text-sm opacity-90">日本語を見て英語を答える</div>
            </div>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => onSelect(LEARNING_MODES.RANDOM)}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl p-4 transition-all flex items-center justify-between group"
          >
            <div className="text-left">
              <div className="font-semibold text-lg">ランダム</div>
              <div className="text-sm opacity-90">カードごとにランダムで切り替え</div>
            </div>
            <Shuffle size={24} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 text-gray-600 hover:text-gray-800 py-2 text-sm"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default LearningModeModal;
