"""分析时间预估算法"""
from dataclasses import dataclass

PHASE_WEIGHTS = {"agent1": 0.60, "agent2": 0.30, "rendering": 0.10}
PHASE_ORDER = {"agent1": 0, "agent2": 1, "rendering": 2}
PHASE_CUMULATIVE = [0.0, 0.60, 0.90]


@dataclass
class TimeEstimate:
    total_seconds: float
    agent1_seconds: float
    agent2_seconds: float
    rendering_seconds: float


def estimate_analysis_time(char_count: int, provider: str = "openai") -> TimeEstimate:
    base_time = {"openai": 8, "anthropic": 10, "deepseek": 12, "custom": 10}.get(provider, 10)
    per_char_time = {"openai": 0.04, "anthropic": 0.05, "deepseek": 0.06, "custom": 0.05}.get(provider, 0.05)
    agent2_overhead = 5
    long_text_penalty = max(0, (char_count - 1000) * 0.02)

    total = base_time + char_count * per_char_time + agent2_overhead + long_text_penalty
    return TimeEstimate(
        total_seconds=round(total, 1),
        agent1_seconds=round(base_time + char_count * per_char_time + long_text_penalty, 1),
        agent2_seconds=round(agent2_overhead + char_count * 0.01, 1),
        rendering_seconds=1.0,
    )


def calculate_progress(phase: str, elapsed_sec: float, estimated_total_sec: float, char_count: int) -> int:
    phase_weight = PHASE_WEIGHTS.get(phase, 0.5)
    phase_index = PHASE_ORDER.get(phase, 0)
    phase_start = PHASE_CUMULATIVE[phase_index]

    phase_estimated_time = estimated_total_sec * phase_weight
    phase_progress = min(elapsed_sec / max(phase_estimated_time, 1), 0.95)
    total_progress = (phase_start + phase_weight * phase_progress) * 100
    return min(int(total_progress), 99)
