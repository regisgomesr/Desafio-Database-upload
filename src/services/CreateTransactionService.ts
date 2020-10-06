import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (!['income', 'outcome'].includes(type)) {
      throw new AppError('Transaction type is invalid!');
    }

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    // eslint-disable-next-line prefer-const
    let checkCategoryExist = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!checkCategoryExist) {
      checkCategoryExist = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(checkCategoryExist);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: checkCategoryExist,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
