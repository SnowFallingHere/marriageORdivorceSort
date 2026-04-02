#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Marriage-Or-Divorce Sort - Core Algorithm
婚姻或离婚排序算法 - 核心实现

This module contains the core algorithm for the Marriage-Or-Divorce Sort,
which simulates relationship dynamics (pairing, cheating, quarreling, divorcing)
to achieve sorting.

本模块包含婚姻或离婚排序算法的核心实现，
通过模拟关系动态（配对、出轨、争吵、离婚）来实现排序。
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from enum import Enum
import random


class Status(Enum):
    """
    Person's relationship status
    人员的关系状态
    """
    SINGLE = 'single'  # 单身
    MARRIED = 'married'  # 已婚
    WAIT_TO_MATCH = 'wait-to-match'  # 等待配对
    QUARREL_WAIT = 'quarrel-wait'  # 争吵后等待（冷静期）


@dataclass
class Person:
    """
    Represents a person in the algorithm
    算法中的个人
    
    Attributes:
        value: The numeric value of the person (用于排序的数值)
        id: Unique identifier (唯一标识符)
        status: Current relationship status (当前关系状态)
        partner: Reference to current partner (当前伴侣)
        divorce_trend: Divorce tendency 0-100 (离婚倾向 0-100)
        pair_history: List of rounds when paired (配对历史记录)
        banned_with: Dict of banned partners {person_id: round_number} (禁止配对的对象)
        quarrel_wait_rounds: Remaining rounds in quarrel cooldown (争吵等待回合数)
        divorced_this_round: Whether divorced in current round (本回合是否刚离婚)
    """
    value: int
    id: int = field(default_factory=lambda: random.randint(10000, 99999))
    status: Status = Status.SINGLE
    partner: Optional['Person'] = None
    divorce_trend: int = 0  # 离婚倾向 0-100
    pair_history: List[int] = field(default_factory=list)  # 配对历史记录
    banned_with: Dict[int, int] = field(default_factory=dict)  # 禁止配对的对象 {person_id: round_number}
    quarrel_wait_rounds: int = 0  # 争吵等待回合数
    divorced_this_round: bool = False  # 本回合是否刚离婚


class MarriageOrDivorceSort:
    """
    Main algorithm class for Marriage-Or-Divorce Sort
    婚姻或离婚排序算法主类
    
    This algorithm simulates relationship dynamics to sort numbers:
    - People pair up (marriage)
    - Some may cheat and find better partners
    - Couples may quarrel and eventually divorce
    - Through these processes, the array becomes sorted
    
    该算法通过模拟关系动态来排序数字：
    - 人们配对（结婚）
    - 有些人会出轨寻找更好的伴侣
    - 夫妻可能争吵最终离婚
    - 通过这些过程，数组变得有序
    """
    
    # Algorithm constants - 算法常量
    PAIR_SUCCESS_RATE = 0.8  # 配对成功率
    CHEATING_OUTSIDE_RATE = 0.6  # 出轨成功率
    DATING_SUCCESS_RATE = 0.5  # 约会成功率
    QUARREL_RATE = 0.6  # 争吵率
    DIVORCE_TREND_INCREMENT = 20  # 每次争吵增加离婚倾向
    DIVORCE_NATURAL_GROWTH = 5  # 每回合自然增长离婚倾向
    PAIR_BAN_ROUNDS = 12  # 禁止配对回合数
    PAIR_CHECK_ROUNDS = 4  # 配对检查回合数
    PAIR_LIMIT = 2  # 配对次数限制
    
    def __init__(self):
        """
        Initialize the algorithm
        初始化算法
        """
        self.round_number: int = 0  # 当前回合数
        self.eliminated: List[Person] = []  # 被淘汰的人
        self.married: List[Tuple[Person, Person]] = []  # 已婚配对列表
        self.pool: List[Person] = []  # 匹配池
        self.events: List[str] = []  # 事件日志
        self._sort_succeeded: bool = False  # 排序是否成功
        self.people: List[Person] = []  # 所有人列表
        self.quarrel_quota: int = 0  # 本回合允许的争吵对数上限
    
    def generate_data(self, n: int, min_val: int = 1, max_val: int = 100) -> List[Person]:
        """
        Generate n unique random numbers as people
        生成 n 个不重复的随机数作为人员
        
        Args:
            n: Number of people to generate (生成人数)
            min_val: Minimum value (最小值)
            max_val: Maximum value (最大值)
            
        Returns:
            List of Person objects (人员对象列表)
        """
        # Check if range is sufficient (检查范围是否足够)
        range_size = max_val - min_val + 1
        if n > range_size:
            raise ValueError(
                f"Cannot generate {n} unique values in range [{min_val}, {max_val}]. "
                f"最大只能生成 {range_size} 个不重复的值。"
            )
        
        self.people = []
        
        # Method 1: Use random.sample for efficiency (方法 1: 使用 random.sample 更高效)
        if n <= range_size * 0.7:  # If n is less than 70% of range
            values = random.sample(range(min_val, max_val + 1), n)
            for value in values:
                self.people.append(Person(value=value))
        else:
            # Method 2: Use set to track used values (方法 2: 使用集合跟踪已用值)
            used_values = set()
            attempts = 0
            max_attempts = n * 10  # Prevent infinite loop (防止无限循环)
            
            while len(self.people) < n and attempts < max_attempts:
                value = random.randint(min_val, max_val)
                if value not in used_values:
                    used_values.add(value)
                    self.people.append(Person(value=value))
                attempts += 1
            
            if len(self.people) < n:
                raise ValueError(
                    f"Failed to generate {n} unique values after {max_attempts} attempts. "
                    f"尝试 {max_attempts} 次后仍未生成足够的唯一值。"
                )
        
        return self.people
    
    def step(self) -> dict:
        """
        Execute one round of the algorithm
        执行算法的一回合
        
        Returns:
            Dictionary containing current state (包含当前状态的字典)
        """
        if self._sort_succeeded:
            return {'sort_succeeded': True}
        
        self.round_number += 1
        self._process_round()
        self._check_sorting()
        
        return {
            'round': self.round_number,
            'eliminated': [{'id': p.id, 'value': p.value} for p in self.eliminated],
            'married': [
                [{'id': p1.id, 'value': p1.value, 'status': p1.status.value},
                 {'id': p2.id, 'value': p2.value, 'status': p2.status.value}]
                for p1, p2 in self.married
            ],
            'pool': [{'id': p.id, 'value': p.value} for p in self.pool],
            'sort_succeeded': self._sort_succeeded,
            'new_events': self.events[-5:],  # 最近 5 个事件
            'all_events': self.events.copy()
        }
    
    def _process_round(self):
        """
        Process one round of the algorithm
        处理一回合的算法流程
        """
        # Calculate quarrel quota for this round (计算本回合允许的争吵对数上限)
        married_pairs = len(self.married)
        self.quarrel_quota = max(1, int((married_pairs + 2) // 3))  # 向上取整
        
        # Reset divorced_this_round flag for all people (重置所有人的离婚标志)
        for person in self.people:
            person.divorced_this_round = False
        
        # Reduce quarrel_wait_rounds and restore MARRIED status (减少争吵等待回合数并恢复状态)
        for person in self.people:
            if person.quarrel_wait_rounds > 0:
                person.quarrel_wait_rounds -= 1
                if person.quarrel_wait_rounds == 0 and person.status == Status.QUARREL_WAIT:
                    person.status = Status.MARRIED  # 等待结束，恢复为已婚状态
        
        # Also check people in pool (也检查匹配池中的人)
        for person in self.pool:
            if person.quarrel_wait_rounds > 0:
                person.quarrel_wait_rounds -= 1
                if person.quarrel_wait_rounds == 0 and person.status == Status.QUARREL_WAIT:
                    person.status = Status.MARRIED
        
        # First round or later rounds (第一回合或后续回合)
        if self.round_number == 1:
            self._first_round_pairing()
        else:
            self._process_later_rounds()
    
    def _first_round_pairing(self):
        """
        First round: direct pairing
        第一回合：直接配对
        """
        # Collect all single people (收集所有单身的人)
        singles = [p for p in self.people if p.status == Status.SINGLE]
        
        # If odd number, eliminate the smallest (如果是奇数，踢掉最小的)
        if len(singles) % 2 != 0:
            min_index = 0
            for i in range(1, len(singles)):
                if singles[i].value < singles[min_index].value:
                    min_index = i
            
            eliminated = singles.pop(min_index)
            eliminated.status = Status.WAIT_TO_MATCH
            self.pool.append(eliminated)
            self.events.append(f"踢最小：{eliminated.value}")
        
        # Pair up remaining people (两两配对剩余的人)
        for i in range(0, len(singles), 2):
            if i + 1 < len(singles):
                p1 = singles[i]
                p2 = singles[i + 1]
                
                # Pair successfully (配对成功)
                p1.status = Status.MARRIED
                p2.status = Status.MARRIED
                p1.partner = p2
                p2.partner = p1
                self.married.append((p1, p2))
                self.events.append(f"配对成功：{p1.value} <-> {p2.value}")
                
                self._record_pair_history(p1, p2)
                self._check_quarrel(p1, p2)
    
    def _process_later_rounds(self):
        """
        Process later rounds: pool pairing, cheating, divorce trend, repair
        处理后续回合：池配对、出轨、离婚倾向、修复
        """
        self._process_pool_pairing()  # 匹配池内配对
        self._process_cheating()  # 处理出轨
        self._process_divorce_trend()  # 处理离婚倾向
        self._process_main_table_repairing()  # 处理主表格修复
    
    def _process_divorce_trend(self):
        """
        Process divorce tendency increase
        处理离婚倾向增加
        """
        # Natural growth for all married pairs (对所有已婚对增加自然增长)
        for p1, p2 in self.married:
            p1.divorce_trend += self.DIVORCE_NATURAL_GROWTH
            p2.divorce_trend += self.DIVORCE_NATURAL_GROWTH
        
        # Process couples in QUARREL_WAIT state (处理处于争吵等待状态的配对)
        to_remove_ids = set()  # 要移除的配对 ID 集合
        pool_to_add = []  # 要添加到匹配池的人
        
        for p1, p2 in self.married:
            if p1.status == Status.QUARREL_WAIT or p2.status == Status.QUARREL_WAIT:
                # Increase divorce tendency for quarreling couples (争吵配对增加离婚倾向)
                p1.divorce_trend += self.DIVORCE_TREND_INCREMENT
                p2.divorce_trend += self.DIVORCE_TREND_INCREMENT
                
                # Check if divorce tendency reaches 100% (检查离婚倾向是否达到 100%)
                if p1.divorce_trend >= 100 or p2.divorce_trend >= 100:
                    self.events.append(f"离婚!: {p1.value} <-> {p2.value}")
                    
                    # Mark for removal (标记移除)
                    to_remove_ids.add((p1.id, p2.id))
                    
                    # Reset states (重置状态)
                    p1.status = Status.WAIT_TO_MATCH
                    p2.status = Status.WAIT_TO_MATCH
                    p1.partner = None
                    p2.partner = None
                    p1.divorce_trend = 0
                    p2.divorce_trend = 0
                    p1.quarrel_wait_rounds = 0
                    p2.quarrel_wait_rounds = 0
                    p1.divorced_this_round = True
                    p2.divorced_this_round = True
                    
                    # Record ban (记录禁止配对)
                    p1.banned_with[p2.id] = self.round_number + self.PAIR_BAN_ROUNDS
                    p2.banned_with[p1.id] = self.round_number + self.PAIR_BAN_ROUNDS
                    
                    # Add to pool (添加到池)
                    pool_to_add.extend([p1, p2])
        
        # Remove divorced pairs (移除离婚的配对)
        self.married = [
            (p1, p2) for p1, p2 in self.married
            if (p1.id, p2.id) not in to_remove_ids and (p2.id, p1.id) not in to_remove_ids
        ]
        
        # Add to pool (添加到池)
        self.pool.extend(pool_to_add)
    
    def _is_banned(self, person1: Person, person2: Person) -> bool:
        """
        Check if two people are banned from pairing
        检查两个人是否被禁止配对
        
        Args:
            person1: First person (第一个人)
            person2: Second person (第二个人)
            
        Returns:
            True if banned (如果被禁止则返回 True)
        """
        ban_round = person1.banned_with.get(person2.id)
        if not ban_round:
            return False
        return self.round_number < ban_round
    
    def _record_pair_history(self, p1: Person, p2: Person):
        """
        Record pairing history and check if ban is needed
        记录配对历史并检查是否需要禁止
        
        Args:
            p1: First person (第一个人)
            p2: Second person (第二个人)
        """
        current_round = self.round_number
        
        # Record pairing (记录配对)
        p1.pair_history.append(current_round)
        p2.pair_history.append(current_round)
        
        # Clean expired records (清理过期记录)
        p1.pair_history = [r for r in p1.pair_history if current_round - r < self.PAIR_CHECK_ROUNDS]
        p2.pair_history = [r for r in p2.pair_history if current_round - r < self.PAIR_CHECK_ROUNDS]
        
        # Check if exceeded limit (检查是否超过限制)
        if len(p1.pair_history) > self.PAIR_LIMIT or len(p2.pair_history) > self.PAIR_LIMIT:
            self.events.append(f"禁止配对：{p1.value} 和 {p2.value} 禁止 {self.PAIR_BAN_ROUNDS} 回合")
    
    def _process_pool_pairing(self):
        """
        Process pairing in the matching pool
        处理匹配池内的配对
        """
        if len(self.pool) < 2:
            return
        
        # Separate those who can pair from those who cannot (分离可以配对和不能配对的人)
        to_pair = []
        remaining = []
        
        for person in self.pool:
            # People who just divorced this round cannot pair (本回合刚离婚的人不能配对)
            if person.status == Status.WAIT_TO_MATCH and not person.divorced_this_round:
                to_pair.append(person)
            else:
                remaining.append(person)
        
        self.events.append(f"匹配池：待配对{len(to_pair)}人，非待配对{len(remaining)}人")
        
        # Pair up people in pool (匹配池内两两配对)
        for i in range(0, len(to_pair), 2):
            if i + 1 < len(to_pair):
                p1 = to_pair[i]
                p2 = to_pair[i + 1]
                
                # Check if banned (检查是否被禁止配对)
                if self._is_banned(p1, p2):
                    remaining.extend([p1, p2])
                    continue
                
                # Pair successfully (配对成功)
                p1.status = Status.MARRIED
                p2.status = Status.MARRIED
                p1.partner = p2
                p2.partner = p1
                self.married.append((p1, p2))
                self.events.append(f"匹配池配对成功：{p1.value} <-> {p2.value}")
                
                self._record_pair_history(p1, p2)
                self._check_quarrel(p1, p2)
            else:
                # Odd one out (奇数剩下的)
                remaining.append(p1)
        
        self.pool = remaining
    
    def _process_main_table_repairing(self):
        """
        Remove incomplete pairs from married list
        从已婚列表中移除不完整的配对
        """
        to_remove = []
        to_add_pool = []
        
        for i, (p1, p2) in enumerate(self.married):
            # Check if both are in valid pair status (检查两人是否都在有效的配对状态)
            p1_in_pair = p1.status in (Status.MARRIED, Status.QUARREL_WAIT)
            p2_in_pair = p2.status in (Status.MARRIED, Status.QUARREL_WAIT)
            
            # If one is not in pair status, the pair is broken (如果有一方不在配对状态，配对破裂)
            if not p1_in_pair or not p2_in_pair:
                to_remove.append(i)
                
                # Add person in WAIT_TO_MATCH status to pool (将等待配对状态的人加入池)
                if p1.status == Status.WAIT_TO_MATCH:
                    to_add_pool.append(p1)
                if p2.status == Status.WAIT_TO_MATCH:
                    to_add_pool.append(p2)
        
        # Remove broken pairs (remove from back to front to avoid index issues)
        # 移除破裂的配对（从后往前移除避免索引问题）
        for i in sorted(to_remove, reverse=True):
            self.married.pop(i)
        
        # Add to pool (添加到池)
        self.pool.extend(to_add_pool)
    
    def _check_quarrel(self, p1: Person, p2: Person):
        """
        Check if a couple should quarrel
        检查一对是否应该争吵
        
        Args:
            p1: First person (第一个人)
            p2: Second person (第二个人)
        """
        if self.quarrel_quota <= 0:
            return  # Quota used up (配额已用完)
        
        if random.random() < self.QUARREL_RATE:
            p1.status = Status.QUARREL_WAIT
            p2.status = Status.QUARREL_WAIT
            p1.quarrel_wait_rounds = 2  # Current round + next round (当前回合 + 下一回合)
            p2.quarrel_wait_rounds = 2
            self.events.append(f"争吵：{p1.value} <-> {p2.value} (等待 2 回合)")
            self.quarrel_quota -= 1
    
    def _process_cheating(self):
        """
        Process cheating behavior
        处理出轨行为
        """
        to_remove_ids = set()  # 要移除的配对 ID
        new_married_pairs = []  # 新的配对
        
        for i, (p1, p2) in enumerate(self.married):
            # Determine cheater and victim (确定作弊者和受害者)
            if p1.value < p2.value:
                cheater, victim = p1, p2
            else:
                cheater, victim = p2, p1
            
            # Cheater must be smaller (作弊者必须更小)
            if cheater.value >= victim.value:
                continue
            
            # Find third party (寻找第三者)
            third_party = None
            max_value = cheater.value
            
            # Search in pool (从匹配池中找)
            for person in self.pool:
                if person.status == Status.WAIT_TO_MATCH and person.value > max_value:
                    max_value = person.value
                    third_party = person
            
            # Search in other married pairs (从其他已婚对中找)
            for j, (other1, other2) in enumerate(self.married):
                if j == i:
                    continue
                # 严格大于当前最大值，避免重复值
                if other1.value > max_value:
                    max_value = other1.value
                    third_party = other1
                if other2.value > max_value:
                    max_value = other2.value
                    third_party = other2
            
            if not third_party:
                continue  # 没有找到合适的第三者
            
            # 第三者必须严格大于作弊者（避免相同值）
            if third_party.value <= cheater.value:
                continue
            
            if random.random() >= self.CHEATING_OUTSIDE_RATE:
                continue  # Cheating failed (出轨失败)
            
            self.events.append(f"出轨：{cheater.value} (受害者:{victim.value}) 被 {third_party.value} 吸引")
            
            if random.random() < self.DATING_SUCCESS_RATE:
                self.events.append(f"约会成功：{cheater.value} 与 {third_party.value} 在一起")
                
                # Remove third party from pool if exists (如果第三者在池中，移除)
                self.pool = [p for p in self.pool if p.id != third_party.id]
                
                # Mark third party's original pair for removal (标记第三者原来的配对)
                for j, (other1, other2) in enumerate(self.married):
                    if j == i:
                        continue
                    if other1.id == third_party.id or other2.id == third_party.id:
                        to_remove_ids.add((other1.id, other2.id))
                        break
                
                # Mark current pair for removal (标记当前配对)
                to_remove_ids.add((p1.id, p2.id))
                
                # Process victim (处理受害者)
                victim.status = Status.WAIT_TO_MATCH
                victim.partner = None
                victim.divorced_this_round = True
                
                # Process cheater (处理作弊者)
                cheater.status = Status.MARRIED
                cheater.partner = third_party
                
                # Process third party (处理第三者)
                third_party_partner = third_party.partner
                third_party.status = Status.MARRIED
                third_party.partner = cheater
                
                # Process third party's original partner (处理第三者原来的伴侣)
                if third_party_partner and third_party_partner.id != cheater.id:
                    third_party_partner.status = Status.WAIT_TO_MATCH
                    third_party_partner.partner = None
                    third_party_partner.divorced_this_round = True
                    self.pool.append(third_party_partner)
                
                # Add new pair (添加新配对)
                new_married_pairs.append((cheater, third_party))
                
                # Add victim to pool (添加受害者到池)
                self.pool.append(victim)
        
        # Remove divorced pairs (移除离婚的配对)
        self.married = [
            (p1, p2) for p1, p2 in self.married
            if (p1.id, p2.id) not in to_remove_ids and (p2.id, p1.id) not in to_remove_ids
        ]
        
        # Add new pairs (添加新配对)
        self.married.extend(new_married_pairs)
    
    def _check_sorting(self):
        """
        Check if the array is sorted
        检查数组是否已排序
        """
        if not self.married:
            return
        
        # Collect all values (收集所有数值)
        all_values = []
        for p1, p2 in self.married:
            all_values.extend([p1.value, p2.value])
        
        # Check if sorted ascending or descending (检查是否正序或倒序)
        ascending = all(all_values[i] >= all_values[i-1] for i in range(1, len(all_values)))
        descending = all(all_values[i] <= all_values[i-1] for i in range(1, len(all_values)))
        
        if ascending or descending:
            self._sort_succeeded = True
            order = "正序" if ascending else "倒序"
            self.events.append(f"排序成功! ({order}) 值：{', '.join(map(str, all_values))}")
    
    @property
    def is_sorted(self) -> bool:
        """Check if sorting succeeded (检查排序是否成功)"""
        return self._sort_succeeded
    
    @property
    def current_round(self) -> int:
        """Get current round number (获取当前回合数)"""
        return self.round_number


# Example usage - 示例用法
if __name__ == '__main__':
    # Create algorithm instance (创建算法实例)
    sorter = MarriageOrDivorceSort()
    
    # Generate data (生成数据)
    sorter.generate_data(n=12, min_val=1, max_val=100)
    
    print("Marriage-Or-Divorce Sort Simulation")
    print("婚姻或离婚排序模拟")
    print("=" * 50)
    
    # Run algorithm until sorted (运行算法直到排序成功)
    while not sorter.is_sorted:
        result = sorter.step()
        print(f"Round {result['round']}: {result['new_events']}")
    
    print("=" * 50)
    print(f"Sorted in {sorter.current_round} rounds!")
    print(f"在 {sorter.current_round} 回合内完成排序!")
